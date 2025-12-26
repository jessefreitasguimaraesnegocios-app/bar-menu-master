import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  bar_id: string;
  items: Array<{
    item_id: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Obter dados da requisição
    const paymentData: PaymentRequest = await req.json();
    const { bar_id, items, total, customer_name, customer_email, customer_phone } = paymentData;

    // Validar dados
    if (!bar_id || !items || items.length === 0 || !total || total <= 0) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos. bar_id, items e total são obrigatórios." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar informações do bar
    const { data: bar, error: barError } = await supabaseClient
      .from("bars")
      .select("id, name, mp_user_id, commission_rate")
      .eq("id", bar_id)
      .eq("is_active", true)
      .single();

    if (barError || !bar) {
      return new Response(
        JSON.stringify({ error: "Bar não encontrado ou inativo." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar detalhes dos itens do menu
    const itemIds = items.map((item) => item.item_id);
    const { data: menuItems, error: menuItemsError } = await supabaseClient
      .from("menu_items")
      .select("id, name, price")
      .in("id", itemIds);

    if (menuItemsError || !menuItems || menuItems.length !== items.length) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar itens do menu." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar mapa de preços dos itens
    const itemsMap = new Map(menuItems.map((item) => [item.id, item]));

    // Preparar itens para a preferência do Mercado Pago
    const mpItems = items.map((item) => {
      const menuItem = itemsMap.get(item.item_id);
      if (!menuItem) {
        throw new Error(`Item ${item.item_id} não encontrado`);
      }
      return {
        id: item.item_id,
        title: menuItem.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.price.toFixed(2)),
      };
    });

    // Obter credenciais do Mercado Pago
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN_MARKETPLACE");
    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: "Credenciais do Mercado Pago não configuradas." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // URL base da aplicação (para back_urls)
    const baseUrl = Deno.env.get("APP_URL") || "https://cardapio-bar.vercel.app";

    // Criar preferência no Mercado Pago com split payment
    const preferenceData = {
      items: mpItems,
      marketplace: bar.mp_user_id, // ID do bar no Mercado Pago
      marketplace_fee: parseFloat(bar.commission_rate.toFixed(4)), // Taxa de comissão (ex: 0.05 = 5%)
      back_urls: {
        success: `${baseUrl}/payment/success`,
        failure: `${baseUrl}/payment/failure`,
        pending: `${baseUrl}/payment/pending`,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      statement_descriptor: bar.name.substring(0, 22), // Máximo 22 caracteres
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Erro ao criar preferência no Mercado Pago:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao criar pagamento no Mercado Pago." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const preference = await mpResponse.json();

    // Preparar dados do pedido para inserir no Supabase
    const orderItems = items.map((item) => {
      const menuItem = itemsMap.get(item.item_id);
      return {
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      };
    });

    // Criar pedido diretamente
    const { data: newOrder, error: orderInsertError } = await supabaseClient
      .from("orders")
      .insert({
        bar_id: bar_id,
        total_amount: total,
        status: "pending",
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
      })
      .select("id")
      .single();

    if (orderInsertError || !newOrder) {
      console.error("Erro ao criar pedido:", orderInsertError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar pedido no banco de dados." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orderId = newOrder.id;

    // Inserir itens do pedido
    const orderItemsData = orderItems.map((item) => ({
      order_id: orderId,
      menu_item_id: item.item_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }));

    const { error: itemsInsertError } = await supabaseClient
      .from("order_items")
      .insert(orderItemsData);

    if (itemsInsertError) {
      console.error("Erro ao inserir itens do pedido:", itemsInsertError);
      await supabaseClient.from("orders").delete().eq("id", orderId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar itens do pedido." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Atualizar pedido com mp_preference_id
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        mp_preference_id: preference.id,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Erro ao atualizar pedido com preference_id:", updateError);
    }

    // Retornar dados da preferência
    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        order_id: orderId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função create-payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  order_id: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer?: {
    name?: string;
    email?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: "approved" | "all";
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

    const body: CreatePaymentRequest = await req.json();
    const { order_id, items, payer, back_urls, auto_return } = body;

    // Obter credenciais do Mercado Pago
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN_MARKETPLACE");
    if (!mpAccessToken) {
      console.error("MP_ACCESS_TOKEN_MARKETPLACE não configurado");
      return new Response(
        JSON.stringify({ error: "Credenciais não configuradas" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o access token é de produção ou teste
    // Tokens de produção começam com "APP_USR-" e tokens de teste começam com "TEST-"
    const isProductionToken = mpAccessToken.startsWith("APP_USR-");
    const isTestToken = mpAccessToken.startsWith("TEST-");
    
    if (!isProductionToken && !isTestToken) {
      console.warn("⚠️ Formato de token não reconhecido. Verifique se é um token válido do Mercado Pago");
    }
    
    if (isTestToken) {
      console.warn("⚠️ ATENÇÃO: Usando token de TESTE (sandbox). Para produção, use um token que comece com 'APP_USR-'");
    } else if (isProductionToken) {
      console.log("✅ Usando token de PRODUÇÃO");
    }

    // Buscar informações do pedido no Supabase
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(`
        *,
        bars:bar_id (
          mp_user_id
        )
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Pedido não encontrado:", orderError);
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mpUserId = (order.bars as any)?.mp_user_id;
    if (!mpUserId) {
      return new Response(
        JSON.stringify({ error: "Bar não possui MP_USER_ID configurado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar preferência de pagamento no Mercado Pago
    // IMPORTANTE: Não especificar sandbox aqui - o access token determina o ambiente
    const preferenceData: any = {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "BRL",
      })),
      payer: payer || {},
      back_urls: back_urls || {},
      auto_return: auto_return || "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      statement_descriptor: "Cantim",
      external_reference: order_id,
    };

    // Se houver URLs de retorno, adicionar
    if (back_urls) {
      preferenceData.back_urls = back_urls;
    }

    // Criar preferência usando a API do Mercado Pago
    // A URL da API determina o ambiente: api.mercadopago.com = produção
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
        // IMPORTANTE: Não adicionar header de sandbox aqui
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Erro ao criar preferência no MP:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao criar preferência de pagamento",
          details: errorText 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const preference = await mpResponse.json();

    // Atualizar pedido com preference_id
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        mp_preference_id: preference.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError);
    }

    // Retornar dados da preferência (incluindo init_point)
    // IMPORTANTE: Sempre usar init_point para produção
    // Se init_point existir, é produção. Se não existir mas sandbox_init_point existir, é sandbox
    const checkoutUrl = preference.init_point || preference.sandbox_init_point;
    
    if (!checkoutUrl) {
      console.error("Nenhum init_point retornado pelo Mercado Pago");
      return new Response(
        JSON.stringify({ error: "Erro ao obter URL de checkout" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se está usando sandbox (aviso)
    if (preference.sandbox_init_point && !preference.init_point) {
      console.warn("⚠️ ATENÇÃO: Usando SANDBOX! Verifique se MP_ACCESS_TOKEN_MARKETPLACE é de PRODUÇÃO");
    }

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: checkoutUrl,
        is_sandbox: !preference.init_point && !!preference.sandbox_init_point,
        // Retornar apenas a URL correta (produção ou sandbox)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


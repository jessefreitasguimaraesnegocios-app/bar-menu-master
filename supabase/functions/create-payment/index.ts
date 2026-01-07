/**
 * Create Payment Edge Function
 * 
 * Cria preferência de pagamento no Mercado Pago com split payment automático.
 * A comissão é calculada baseada no commission_rate do bar e aplicada via application_fee.
 */

// @ts-ignore - Deno types
/// <reference lib="deno.ns" />

// Declarações de tipo globais para Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare const Response: typeof globalThis.Response;
declare const fetch: typeof globalThis.fetch;
declare const console: typeof globalThis.console;

// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore - Deno import
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
  payment_method?: "pix" | "checkout"; // Novo: permite escolher método de pagamento
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variáveis de ambiente não configuradas:", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Validar body da requisição
    let body: CreatePaymentRequest;
    try {
      const bodyText = await req.text();
      console.log("📥 Body recebido (raw):", bodyText.substring(0, 500)); // Log primeiro 500 chars
      body = JSON.parse(bodyText);
      console.log("📥 Body parseado:", {
        hasOrderId: !!body.order_id,
        orderId: body.order_id,
        hasItems: !!body.items,
        itemsCount: body.items?.length || 0,
        bodyKeys: Object.keys(body),
      });
    } catch (error) {
      console.error("❌ Erro ao fazer parse do body:", error);
      return new Response(
        JSON.stringify({ error: "Body da requisição inválido", details: error instanceof Error ? error.message : String(error) }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { order_id, items, payer, back_urls, auto_return, payment_method = "checkout" } = body;

    // Validar parâmetros obrigatórios
    if (!order_id) {
      console.error("❌ order_id não fornecido. Body recebido:", {
        bodyKeys: Object.keys(body),
        bodyValues: Object.values(body).map(v => typeof v === 'object' ? '[object]' : String(v)),
        orderIdType: typeof body.order_id,
        orderIdValue: body.order_id,
      });
      return new Response(
        JSON.stringify({ 
          error: "order_id é obrigatório",
          received: {
            bodyKeys: Object.keys(body),
            orderIdPresent: 'order_id' in body,
            orderIdValue: body.order_id,
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "items é obrigatório e deve conter pelo menos um item" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Buscar informações do pedido e bar no Supabase
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(`
        *,
        bars:bar_id (
          mp_user_id,
          mp_access_token,
          commission_rate
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

    // Validar estrutura do order
    if (!order.bar_id) {
      console.error("Order sem bar_id:", order);
      return new Response(
        JSON.stringify({ error: "Pedido inválido: bar_id não encontrado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bar = order.bars as any;
    if (!bar) {
      console.error("Bar não encontrado para order:", order.bar_id);
      return new Response(
        JSON.stringify({ error: "Bar não encontrado para este pedido" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mpUserId = bar?.mp_user_id;
    const mpAccessTokenBar = bar?.mp_access_token; // Access token do bar para pagamentos diretos
    const commissionRate = bar?.commission_rate || 0.05;

    // Validar que o bar possui mp_user_id configurado
    if (!mpUserId) {
      console.error("Bar não possui MP_USER_ID configurado:", order.bar_id);
      return new Response(
        JSON.stringify({ 
          error: "Bar não possui Mercado Pago conectado. Conecte o bar ao Mercado Pago antes de processar pagamentos." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar que mp_user_id é um número válido (necessário para collector_id)
    const mpUserIdNumber = parseInt(String(mpUserId));
    if (isNaN(mpUserIdNumber) || mpUserIdNumber <= 0) {
      console.error("❌ mp_user_id inválido:", { mpUserId, mpUserIdNumber, barId: order.bar_id });
      return new Response(
        JSON.stringify({ 
          error: `mp_user_id do bar é inválido: ${mpUserId}. Reautorize a conexão OAuth do bar.` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Bar configurado para split payment:", {
      barId: order.bar_id,
      mpUserId: mpUserId,
      mpUserIdNumber: mpUserIdNumber,
      commissionRate: `${(commissionRate * 100).toFixed(2)}%`,
    });

    // Para PIX direto, precisamos apenas do mp_user_id (não do access_token do bar)
    // O split payment usa o access_token do marketplace

    // Calcular application_fee para split payment
    const totalAmount = parseFloat(String(order.total_amount || 0));
    if (isNaN(totalAmount) || totalAmount <= 0) {
      console.error("Total amount inválido:", order.total_amount);
      return new Response(
        JSON.stringify({ error: "Valor total do pedido inválido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const applicationFee = totalAmount * commissionRate;
    
    if (applicationFee <= 0 || isNaN(applicationFee)) {
      console.error("Application fee inválido:", { totalAmount, commissionRate, applicationFee });
      return new Response(
        JSON.stringify({ error: "Erro ao calcular comissão" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("💰 Split Payment Config:", {
      totalAmount,
      commissionRate: `${(commissionRate * 100).toFixed(2)}%`,
      applicationFee,
      barAmount: totalAmount - applicationFee,
      mpUserId,
      mpUserIdNumber: mpUserIdNumber,
      paymentMethod: payment_method,
      collectorId: mpUserIdNumber, // ID que receberá o restante (bar)
    });

    // ✅ FORMA CORRETA: Usar APENAS Checkout (preferences) para split payment
    // Mercado Pago suporta split oficialmente no Checkout, não no PIX direto
    // Essa é a forma que Uber Eats, iFood, etc usam.

    // ✅ SOLUÇÃO DEFINITIVA: Hard-code URLs (sem variáveis de ambiente)
    // Mercado Pago exige back_urls.success quando auto_return existe
    const backUrls = {
      success: "https://cardapio-bar.vercel.app/pagamento/sucesso",
      failure: "https://cardapio-bar.vercel.app/pagamento/erro",
      pending: "https://cardapio-bar.vercel.app/pagamento/pendente",
    };

    // Criar preferência de pagamento no Mercado Pago (checkout tradicional)
    // Seguindo exatamente o modelo do Mercado Pago
    const preferenceData: any = {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "BRL",
      })),
      payer: payer || {},
      back_urls: {
        success: backUrls.success,
        failure: backUrls.failure,
        pending: backUrls.pending,
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      statement_descriptor: "Cantim",
      external_reference: order_id,
      // Split Payment: application_fee é a comissão que o marketplace recebe
      // O Mercado Pago automaticamente divide: total = bar_amount + application_fee
      // IMPORTANTE: collector_id define para quem vai o restante (bar)
      application_fee: parseFloat(applicationFee.toFixed(2)),
      // Configurar collector_id para o bar receber o restante
      // O mp_user_id deve ser convertido para número (já validado acima)
      collector_id: mpUserIdNumber,
      // Configuração de métodos de pagamento conforme modelo do Mercado Pago
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
        // Se for PIX, forçar PIX como método padrão (mas ainda usar Checkout)
        ...(payment_method === "pix" ? { default_payment_method_id: "pix" } : {}),
      },
    };

    // ✅ LOG OBRIGATÓRIO: Verificar payload ANTES de enviar ao Mercado Pago
    console.log("🔍 PREFERENCE ENVIADA AO MERCADO PAGO:");
    console.log(JSON.stringify(preferenceData, null, 2));
    
    // Validação final: garantir que back_urls.success existe no objeto final
    if (!preferenceData.back_urls?.success) {
      console.error("❌ ERRO CRÍTICO: back_urls.success não existe no payload final!");
      return new Response(
        JSON.stringify({ 
          error: "back_urls.success é obrigatório mas não foi encontrado no payload final" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("✅ back_urls.success confirmado:", preferenceData.back_urls.success);
    console.log("✅ Split Payment configurado na preferência:", {
      applicationFee: preferenceData.application_fee,
      collectorId: preferenceData.collector_id,
      totalAmount,
      barAmount: totalAmount - preferenceData.application_fee,
      mpUserId: mpUserId,
    });

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

    // Retornar resposta baseada no método de pagamento
    // Quando for PIX via Checkout, o QR code aparece no init_point
    // Quando for cartão, também redireciona para init_point
    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: checkoutUrl,
        payment_method: payment_method || "checkout", // Indica se foi PIX ou checkout
        is_sandbox: !preference.init_point && !!preference.sandbox_init_point,
        // IMPORTANTE: Com Checkout, sempre usar init_point (QR code aparece lá)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Erro ao criar pagamento:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


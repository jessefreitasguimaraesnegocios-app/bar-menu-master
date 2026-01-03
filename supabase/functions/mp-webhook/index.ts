import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MercadoPagoNotification {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
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

    // Obter dados da notificação
    const notification: MercadoPagoNotification = await req.json();
    
    console.log("Webhook recebido:", JSON.stringify(notification, null, 2));

    // Processar apenas notificações de pagamento
    if (notification.type !== "payment") {
      return new Response(
        JSON.stringify({ message: "Tipo de notificação não suportado" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paymentId = notification.data.id;

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

    // Buscar dados do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
      },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Erro ao buscar pagamento no MP:", errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar pagamento" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payment = await mpResponse.json();

    // Mapear status do Mercado Pago para status do nosso sistema
    const statusMap: Record<string, string> = {
      pending: "pending",
      approved: "approved",
      authorized: "approved",
      in_process: "pending",
      in_mediation: "pending",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "refunded",
    };

    const orderStatus = statusMap[payment.status] || "pending";
    const paymentStatus = payment.status;

    // Buscar pedido pelo preference_id
    const preferenceId = payment.preference_id;
    
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("mp_preference_id", preferenceId)
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

    // Atualizar status do pedido
    const { error: updateOrderError } = await supabaseClient
      .from("orders")
      .update({
        status: orderStatus,
        mp_payment_id: payment.id,
        payment_method: mapPaymentMethod(payment.payment_type_id),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateOrderError) {
      console.error("Erro ao atualizar pedido:", updateOrderError);
    }

    // Calcular valores do split payment
    const totalAmount = parseFloat(payment.transaction_amount);
    const feeAmount = parseFloat(payment.fee_details?.reduce((sum: number, fee: any) => sum + fee.amount, 0) || 0);
    
    // Buscar taxa de comissão do bar
    const { data: bar } = await supabaseClient
      .from("bars")
      .select("commission_rate")
      .eq("id", order.bar_id)
      .single();

    const commissionRate = bar?.commission_rate || 0.05;
    const marketplaceFee = totalAmount * commissionRate;
    const barAmount = totalAmount - marketplaceFee;

    // Criar ou atualizar registro de pagamento
    const { data: existingPayment } = await supabaseClient
      .from("payments")
      .select("id")
      .eq("mp_payment_id", payment.id)
      .single();

    const paymentData = {
      order_id: order.id,
      mp_payment_id: payment.id,
      status: paymentStatus,
      amount: totalAmount,
      fee_amount: feeAmount,
      marketplace_fee: marketplaceFee,
      bar_amount: barAmount,
      payment_method: mapPaymentMethod(payment.payment_type_id),
      mp_notification_data: payment,
      mp_merchant_order_id: payment.merchant_order_id,
      mp_status_detail: payment.status_detail,
      updated_at: new Date().toISOString(),
    };

    if (existingPayment) {
      // Atualizar pagamento existente
      const { error: updatePaymentError } = await supabaseClient
        .from("payments")
        .update(paymentData)
        .eq("id", existingPayment.id);

      if (updatePaymentError) {
        console.error("Erro ao atualizar pagamento:", updatePaymentError);
      }
    } else {
      // Criar novo pagamento
      const { error: insertPaymentError } = await supabaseClient
        .from("payments")
        .insert({
          ...paymentData,
          created_at: new Date().toISOString(),
        });

      if (insertPaymentError) {
        console.error("Erro ao criar pagamento:", insertPaymentError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Webhook processado com sucesso",
        order_id: order.id,
        payment_status: paymentStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Erro ao processar webhook:", error);
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

// Função auxiliar para mapear método de pagamento
function mapPaymentMethod(paymentTypeId: string): string {
  const methodMap: Record<string, string> = {
    credit_card: "credit_card",
    debit_card: "debit_card",
    bank_transfer: "bank_transfer",
    ticket: "ticket",
    account_money: "other",
  };

  if (paymentTypeId?.startsWith("credit_card")) return "credit_card";
  if (paymentTypeId?.startsWith("debit_card")) return "debit_card";
  if (paymentTypeId === "pix") return "pix";
  if (paymentTypeId === "bank_transfer") return "bank_transfer";
  if (paymentTypeId === "ticket") return "ticket";

  return methodMap[paymentTypeId || ""] || "other";
}


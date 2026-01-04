// @ts-ignore - Deno types
/// <reference lib="deno.ns" />
// @ts-ignore - Deno types
/// <reference lib="dom" />

// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Log imediato para confirmar que a função está sendo executada
  console.log("🚀 Edge Function mp-oauth-callback invocada");
  console.log("🚀 Método:", req.method);
  console.log("🚀 URL:", req.url);
  console.log("🚀 Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

  // CORS preflight - Edge Functions do Supabase não requerem autenticação para callbacks OAuth
  if (req.method === "OPTIONS") {
    console.log("✅ Respondendo a OPTIONS (CORS preflight)");
    return new Response("ok", { headers: corsHeaders });
  }

  // IMPORTANTE: Esta função NÃO requer autenticação - é um callback público do Mercado Pago
  // Se você ver um erro 401 aqui, pode ser que o Supabase esteja bloqueando a requisição
  // antes dela chegar ao código. Verifique se a Edge Function está configurada como pública.

  try {
    // Verificar se os secrets básicos estão disponíveis (para diagnóstico)
    // @ts-ignore - Deno global
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore - Deno global
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl) {
      console.error("❌ SUPABASE_URL não está configurado como secret!");
      return json({ 
        error: "Configuração faltando: SUPABASE_URL não está configurado. Configure via: supabase secrets set SUPABASE_URL=...",
        code: 500
      }, 500);
    }
    
    if (!serviceKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY não está configurado como secret!");
      return json({ 
        error: "Configuração faltando: SUPABASE_SERVICE_ROLE_KEY não está configurado. Configure via: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...",
        code: 500
      }, 500);
    }

    console.log("🔐 OAuth callback recebido - Método:", req.method);
    console.log("🔐 URL completa:", req.url);
    
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // deve conter bar_id
    const error = url.searchParams.get("error");

    console.log("🔐 Parâmetros recebidos:", { 
      hasCode: !!code, 
      codeLength: code?.length || 0,
      hasState: !!state, 
      stateValue: state,
      hasError: !!error,
      errorValue: error
    });

    // IMPORTANTE: Esta Edge Function NÃO deve ser acessada diretamente!
    // Ela deve ser chamada APENAS pelo Mercado Pago após o fluxo OAuth completo:
    // 1. Usuário clica "Conectar Mercado Pago" → redireciona para auth.mercadopago.com/authorization
    // 2. Usuário faz login e autoriza → Mercado Pago redireciona aqui com code e state
    // 3. Esta função troca o code por tokens e salva no banco

    if (error) {
      console.error("❌ Erro no OAuth do Mercado Pago:", error);
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent(`Erro de autorização: ${error}`)}`, 302);
    }

    // Validação crítica: code e state são obrigatórios
    // Se não estiverem presentes, significa que:
    // - A URL foi acessada diretamente sem passar pelo fluxo OAuth, OU
    // - O code expirou (tem validade de alguns minutos), OU
    // - Houve um erro no redirecionamento do Mercado Pago
    if (!code) {
      console.error("❌ Code de autorização não fornecido!");
      console.error("❌ Isso geralmente acontece quando:");
      console.error("   1. A URL foi acessada diretamente no navegador");
      console.error("   2. O code expirou (eles têm validade curta)");
      console.error("   3. O fluxo OAuth não foi completado corretamente");
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent("Code de autorização não encontrado. Certifique-se de seguir o fluxo OAuth completo: clique em 'Conectar Mercado Pago', faça login e autorize a aplicação.")}`, 302);
    }

    if (!state) {
      console.error("❌ State (bar_id) não fornecido!");
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent("State (ID do bar) não fornecido. Certifique-se de iniciar o fluxo OAuth pelo Admin Portal.")}`, 302);
    }

    // Validar formato do code (geralmente começa com TG-)
    if (!code.startsWith("TG-") && code.length < 20) {
      console.warn("⚠️ Code com formato incomum:", code.substring(0, 20) + "...");
    }

    // Extrair bar_id do state
    const barId = state;
    console.log("🔐 Bar ID extraído do state:", barId);

    // @ts-ignore - Deno global
    const mpClientId = Deno.env.get("MP_CLIENT_ID");
    // @ts-ignore - Deno global
    const mpClientSecret = Deno.env.get("MP_CLIENT_SECRET");
    // @ts-ignore - Deno global
    // IMPORTANTE: O redirect_uri DEVE ser exatamente o mesmo usado na requisição inicial do OAuth
    // Se não estiver configurado como secret, usamos o padrão
    let redirectUri = Deno.env.get("MP_REDIRECT_URI");
    
    // Se não estiver configurado, gerar automaticamente (deve corresponder à URL atual)
    if (!redirectUri) {
      redirectUri = `${supabaseUrl}/functions/v1/mp-oauth-callback`;
      console.log("⚠️ MP_REDIRECT_URI não configurado, usando padrão:", redirectUri);
    }

    // Validar que os valores não estão vazios ou undefined
    const hasValidClientId = mpClientId && mpClientId.trim().length > 0;
    const hasValidClientSecret = mpClientSecret && mpClientSecret.trim().length > 0;
    const hasValidRedirectUri = redirectUri && redirectUri.trim().length > 0;

    console.log("🔐 Verificando credenciais OAuth:", {
      hasClientId: hasValidClientId,
      hasClientSecret: hasValidClientSecret,
      hasRedirectUri: hasValidRedirectUri,
      redirectUri: redirectUri,
      clientIdLength: mpClientId?.length || 0,
      clientSecretLength: mpClientSecret?.length || 0
    });

    if (!hasValidClientId || !hasValidClientSecret || !hasValidRedirectUri) {
      console.error("❌ Credenciais OAuth do Mercado Pago inválidas ou não configuradas:", {
        clientIdMissing: !hasValidClientId,
        clientSecretMissing: !hasValidClientSecret,
        redirectUriMissing: !hasValidRedirectUri
      });
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent("Configuração OAuth inválida. Verifique os secrets MP_CLIENT_ID, MP_CLIENT_SECRET e MP_REDIRECT_URI no Supabase.")}`, 302);
    }

    // ============================================
    // TROCAR CÓDIGO POR TOKENS
    // ============================================
    // IMPORTANTE: Não usar MP_ACCESS_TOKEN_MARKETPLACE aqui!
    // Esse token é só para criar pagamentos depois que o bar já estiver conectado.
    // 
    // Neste ponto, temos:
    // - code: código temporário recebido do Mercado Pago (válido por alguns minutos)
    // - state: ID do bar que está conectando
    // - client_id + client_secret: credenciais OAuth configuradas nos secrets
    // 
    // Agora vamos trocar o code por access_token e refresh_token do bar
    console.log("🔄 Trocando código OAuth por tokens do Mercado Pago...");
    console.log("🔄 Endpoint: POST https://api.mercadopago.com/oauth/token");
    console.log("🔄 Parâmetros da requisição:", {
      client_id: mpClientId?.substring(0, 15) + "...",
      has_client_secret: !!mpClientSecret,
      grant_type: "authorization_code",
      code_preview: code.substring(0, 20) + "...",
      code_length: code.length,
      redirect_uri: redirectUri
    });

    // Construir body da requisição
    // IMPORTANTE: O OAuth do Mercado Pago usa application/x-www-form-urlencoded
    // NÃO inclua Authorization header aqui - as credenciais vão no body
    const tokenRequestParams = new URLSearchParams({
      client_id: mpClientId!.trim(),
      client_secret: mpClientSecret!.trim(),
      grant_type: "authorization_code",
      code: code.trim(),
      redirect_uri: redirectUri.trim(),
    });

    console.log("🔄 Fazendo requisição para trocar code por tokens...");

    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // NÃO incluir Authorization header aqui - o OAuth usa client_id/client_secret no body
      },
      body: tokenRequestParams,
    });

    console.log("🔄 Status da resposta do Mercado Pago:", tokenResponse.status, tokenResponse.statusText);
    
    // Se retornar 401, o problema está nas credenciais OAuth
    if (tokenResponse.status === 401) {
      const errorText = await tokenResponse.text();
      console.error("❌ ERRO 401 - Credenciais OAuth inválidas do Mercado Pago");
      console.error("❌ Resposta do Mercado Pago:", errorText);
      console.error("❌ Possíveis causas:");
      console.error("   1. MP_CLIENT_ID ou MP_CLIENT_SECRET incorretos");
      console.error("   2. redirect_uri não corresponde ao configurado no MP Dashboard");
      console.error("   3. Code expirado ou já usado");
      console.error("   4. Aplicação não autorizada no Mercado Pago");
      
      let errorMessage = "Credenciais OAuth inválidas. Verifique MP_CLIENT_ID, MP_CLIENT_SECRET e MP_REDIRECT_URI.";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
          console.error("❌ Mensagem do Mercado Pago:", errorJson.message);
        }
        if (errorJson.error_description) {
          console.error("❌ Descrição do erro:", errorJson.error_description);
          errorMessage += ` ${errorJson.error_description}`;
        }
      } catch {
        // Se não for JSON, usar o texto direto
        console.error("❌ Erro (texto):", errorText);
      }
      
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent(errorMessage)}`, 302);
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Erro ao trocar código por tokens:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      let errorMessage = "Erro ao obter tokens do Mercado Pago";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
        console.error("❌ Detalhes do erro:", errorJson);
      } catch {
        // Se não for JSON, usar o texto direto
        errorMessage = errorText || errorMessage;
      }
      
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent(errorMessage)}`, 302);
    }

    const tokenData = await tokenResponse.json();
    console.log("✅ Tokens recebidos do Mercado Pago:", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      userId: tokenData.user_id
    });

    const { access_token, refresh_token, user_id } = tokenData;

    if (!access_token || !user_id) {
      console.error("❌ Tokens incompletos do Mercado Pago:", tokenData);
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent("Tokens incompletos do Mercado Pago")}`, 302);
    }

    // Buscar informações do usuário no Mercado Pago (opcional, apenas para validação)
    console.log("🔍 Buscando informações do usuário no Mercado Pago...");
    try {
      const userResponse = await fetch(`https://api.mercadopago.com/users/${user_id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log("✅ Informações do usuário obtidas:", {
          userId: userData.id,
          email: userData.email
        });
      } else {
        console.warn("⚠️ Não foi possível buscar informações do usuário, mas continuando...");
      }
    } catch (userError) {
      console.warn("⚠️ Erro ao buscar informações do usuário, mas continuando:", userError);
    }

    // Atualizar bar no Supabase com os tokens
    // mp_access_token é salvo no banco mas NUNCA exposto ao frontend
    console.log("💾 Salvando tokens no banco de dados para bar:", barId);
    
    try {
      const updateResponse = await supabaseFetch(
        `bars?id=eq.${barId}`,
        "PATCH",
        {
          mp_user_id: String(user_id),
          mp_access_token: access_token,
          mp_refresh_token: refresh_token || null,
          mp_oauth_connected_at: new Date().toISOString(),
        }
      );

      console.log("✅ Bar atualizado com sucesso:", updateResponse);
    } catch (updateError: any) {
      console.error("❌ Erro ao atualizar bar no banco de dados:", updateError);
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent("Erro ao salvar tokens no banco de dados: " + (updateError?.message || "Erro desconhecido"))}`, 302);
    }

    console.log("✅ OAuth conectado com sucesso para bar:", barId);

    // Redirecionar para página de sucesso
    // @ts-ignore - Deno global
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
    return Response.redirect(`${frontendUrl}/admin?oauth=success&bar_id=${barId}`, 302);

  } catch (err: any) {
    console.error("Erro ao processar OAuth callback:", err);
    // @ts-ignore - Deno global
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
    return Response.redirect(`${frontendUrl}/admin?oauth=error&message=${encodeURIComponent(err.message || "Erro desconhecido")}`, 302);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function supabaseFetch(path: string, method: string, body: any) {
  // @ts-ignore - Deno global
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // @ts-ignore - Deno global
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Variáveis de ambiente do Supabase não configuradas:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey
    });
    throw new Error("Variáveis de ambiente do Supabase não configuradas. Verifique os secrets SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  console.log(`📡 Fazendo requisição ao Supabase: ${method} ${path}`);

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(`📡 Resposta do Supabase: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Erro na requisição Supabase (${method} ${path}):`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Supabase API error: ${response.status} ${errorText}`);
  }

  if (method === "DELETE" && response.status === 204) {
    return null;
  }

  if ((method === "PATCH" || method === "POST") && response.status === 204) {
    return {};
  }

  const jsonData = await response.json();
  console.log(`✅ Resposta do Supabase processada com sucesso`);
  return jsonData;
}


/**
 * Mercado Pago OAuth Callback Edge Function
 * 
 * Esta função é PÚBLICA (sem JWT) porque é chamada pelo redirect do Mercado Pago
 * que não envia Authorization header.
 * 
 * ⚠️ DEPLOY OBRIGATÓRIO VIA CLI (NPX RECOMENDADO):
 * 
 * 1. Login: npx supabase@latest login
 * 2. Deploy: npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt
 * 
 * O flag --no-verify-jwt é OBRIGATÓRIO! Sem ele, a função sempre retornará 401.
 * 
 * NOTA: Este arquivo foi consolidado em um único arquivo devido a limitações
 * do bundler do Supabase com múltiplos arquivos.
 */

// @ts-ignore - Deno types
/// <reference lib="deno.ns" />

// Declarações de tipo globais para Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
    toObject?(): Record<string, string>;
  };
};

declare const Response: typeof globalThis.Response;
declare const Request: typeof globalThis.Request;
declare const fetch: typeof globalThis.fetch;
declare const console: typeof globalThis.console;
declare const URL: typeof globalThis.URL;
declare const URLSearchParams: typeof globalThis.URLSearchParams;

// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// ============================================================================
// TYPES
// ============================================================================

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  user_id: number;
  expires_in?: number;
  scope?: string;
}

interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  message?: string;
}

interface MercadoPagoUser {
  id: number;
  email?: string;
  nickname?: string;
}

interface OAuthCallbackParams {
  code: string;
  state: string; // bar_id
  error?: string;
}

interface BarUpdateData {
  mp_user_id: string;
  seller_access_token: string; // ✅ CORRIGIDO: Token do SELLER (bar), não do marketplace
  mp_refresh_token?: string | null;
  mp_oauth_connected_at: string;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendUrl: string;
  supabaseUrl: string;
  serviceKey: string;
}

// ============================================================================
// CONFIG
// ============================================================================

function getOAuthConfig(): OAuthConfig {
  // Debug: Listar TODAS as variáveis de ambiente disponíveis (apenas nomes, não valores)
  const allEnvKeys: string[] = [];
  try {
    // Tentar acessar todas as variáveis conhecidas do Supabase
    const knownKeys: string[] = [
      "MP_CLIENT_ID", "MP_CLIENT_SECRET", "MP_REDIRECT_URI", "FRONTEND_URL",
      "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY",
      "MP_ACCESS_TOKEN_MARKETPLACE", "SUPABASE_DB_URL"
    ];
    knownKeys.forEach((key: string) => {
      if (Deno.env.get(key)) {
        allEnvKeys.push(key);
      }
    });
  } catch (e) {
    console.warn("⚠️ Não foi possível listar variáveis de ambiente:", e);
  }

  const clientId = Deno.env.get("MP_CLIENT_ID");
  const clientSecret = Deno.env.get("MP_CLIENT_SECRET");
  const redirectUri = Deno.env.get("MP_REDIRECT_URI");
  const frontendUrlRaw = Deno.env.get("FRONTEND_URL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // Debug: Log quais variáveis estão presentes (sem mostrar valores)
  console.log("🔍 Verificando variáveis de ambiente:", {
    hasMP_CLIENT_ID: !!clientId,
    hasMP_CLIENT_SECRET: !!clientSecret,
    hasMP_REDIRECT_URI: !!redirectUri,
    hasFRONTEND_URL: !!frontendUrlRaw,
    hasSUPABASE_URL: !!supabaseUrl,
    hasSUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
    availableEnvKeys: allEnvKeys,
    totalAvailable: allEnvKeys.length,
  });

  // Debug adicional: Tentar acessar via Deno.env.toObject() se disponível
  try {
    if (Deno.env.toObject && typeof Deno.env.toObject === 'function') {
      const allEnv = Deno.env.toObject();
      const envKeys = Object.keys(allEnv).filter(key => 
        key.includes('MP_') || key.includes('SUPABASE_') || key.includes('FRONTEND_')
      );
      console.log("🔍 Todas as variáveis de ambiente disponíveis (filtradas):", envKeys);
    }
  } catch (e) {
    // Ignorar se toObject não estiver disponível
  }
    
  // Validação detalhada com mensagens de erro claras
  if (!clientId || !clientSecret) {
    const missing: string[] = [];
    if (!clientId) missing.push("MP_CLIENT_ID");
    if (!clientSecret) missing.push("MP_CLIENT_SECRET");
    console.error("❌ Variáveis faltando:", missing);
    throw new Error(
      `Variáveis de ambiente obrigatórias não configuradas: ${missing.join(", ")}. ` +
      `Configure-as no Supabase Dashboard → Edge Functions → Settings → Environment Variables. ` +
      `Após configurar, faça redeploy: npx supabase@latest functions deploy mp-oauth-callback --no-verify-jwt`
    );
  }

  if (!supabaseUrl || !serviceKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push("SUPABASE_URL");
    if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    throw new Error(
      `Variáveis de ambiente do Supabase não configuradas: ${missing.join(", ")}. ` +
      `Configure-as no Supabase Dashboard → Edge Functions → Settings → Environment Variables`
    );
  }

  // Limpar e validar frontendUrl
  let frontendUrl = "http://localhost:8080"; // Default
  if (frontendUrlRaw) {
    frontendUrl = frontendUrlRaw.trim().replace(/[`'"]/g, ''); // Remove backticks, quotes
    // Garantir que seja uma URL válida
    try {
      new URL(frontendUrl);
    } catch {
      console.warn("⚠️ FRONTEND_URL inválido, usando default:", frontendUrlRaw);
      frontendUrl = "http://localhost:8080";
    }
  }

  // Limpar e validar frontendUrl
  let cleanFrontendUrl = "http://localhost:8080"; // Default
  if (frontendUrl) {
    cleanFrontendUrl = frontendUrl.trim().replace(/[`'"]/g, ''); // Remove backticks, quotes
    // Garantir que seja uma URL válida
    try {
      new URL(cleanFrontendUrl);
    } catch {
      console.warn("⚠️ FRONTEND_URL inválido, usando default:", frontendUrl);
      cleanFrontendUrl = "http://localhost:8080";
    }
  }

  // Se redirectUri não estiver configurado, gerar automaticamente
  // IMPORTANTE: Deve ser EXATAMENTE o mesmo usado no frontend (sem barra final)
  let finalRedirectUri = redirectUri || `${supabaseUrl}/functions/v1/mp-oauth-callback`;
  finalRedirectUri = finalRedirectUri.trim().replace(/\/$/, ''); // Remove barra final

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: finalRedirectUri,
    frontendUrl: cleanFrontendUrl,
    supabaseUrl: supabaseUrl.trim(),
    serviceKey: serviceKey.trim(),
  };
}

// ============================================================================
// MERCADO PAGO CLIENT
// ============================================================================

const MP_API_BASE = "https://api.mercadopago.com";

class MercadoPagoClient {
  /**
   * Troca o código de autorização OAuth por tokens de acesso
   */
  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    if (!code || code.trim().length === 0) {
      throw new Error("Código de autorização não pode ser vazio");
    }

    if (!clientId || !clientSecret) {
      throw new Error("Credenciais OAuth inválidas");
    }

    // IMPORTANTE: O redirect_uri DEVE ser EXATAMENTE o mesmo usado no link inicial
    // Sem barra no final, sem query params, sem espaços
    const finalRedirectUri = redirectUri.trim().replace(/\/$/, ''); // Remove barra final se existir
    
    const params = new URLSearchParams({
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      grant_type: "authorization_code",
      code: code.trim(),
      redirect_uri: finalRedirectUri,
    });

    // ✅ DEBUG: Logs detalhados para identificar o problema
    console.log("🔄 Trocando code por tokens no Mercado Pago OAuth...");
    console.log("📋 Parâmetros enviados para /oauth/token:", {
      grant_type: "authorization_code",
      code: code.trim().substring(0, 20) + '...',
      code_length: code.trim().length,
      client_id: clientId.trim().substring(0, 10) + '...',
      client_id_length: clientId.trim().length,
      redirect_uri: finalRedirectUri,
      redirect_uri_length: finalRedirectUri.length,
      endpoint: `${MP_API_BASE}/oauth/token`,
    });

    const response = await fetch(`${MP_API_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      const errorMessage = errorData.message || errorData.error_description || errorData.error || "Erro desconhecido";
      
      console.error("❌ Erro ao obter tokens:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        errorData: errorData,
        redirect_uri_used: finalRedirectUri,
        client_id_prefix: clientId.trim().substring(0, 10) + '...',
      });
      
      // Mensagens específicas para erro 401
      if (response.status === 401) {
        throw new Error(
          `Erro 401: Credenciais inválidas ou redirect_uri diferente. ` +
          `Verifique: (1) Client ID e Secret de PRODUÇÃO (não sandbox), (2) redirect_uri idêntico ao usado na autorização inicial. ` +
          `redirect_uri usado: ${finalRedirectUri} | Detalhes: ${errorMessage}`
        );
      }
      
      throw new Error(`Falha ao obter tokens: ${errorMessage}`);
    }

    const tokenData = await response.json() as OAuthTokenResponse;

    // ✅ VALIDAÇÃO CRÍTICA: Garantir que a resposta contém todos os campos necessários
    if (!tokenData.access_token || !tokenData.user_id) {
      console.error("❌ Resposta incompleta do Mercado Pago:", {
        hasAccessToken: !!tokenData.access_token,
        hasUserId: !!tokenData.user_id,
        responseKeys: Object.keys(tokenData),
        fullResponse: JSON.stringify(tokenData),
      });
      throw new Error("Resposta do Mercado Pago incompleta: tokens ausentes");
    }

    // ✅ LOG DETALHADO: Mostrar exatamente o que foi retornado pelo OAuth
    console.log("✅ Tokens obtidos com sucesso do Mercado Pago OAuth:", {
      user_id: tokenData.user_id, // ✅ Este é o mp_user_id do SELLER (bar)
      user_id_type: typeof tokenData.user_id,
      access_token_prefix: tokenData.access_token?.substring(0, 20) + '...',
      access_token_length: tokenData.access_token?.length,
      hasRefreshToken: !!tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      // ✅ IMPORTANTE: Este access_token é do SELLER (bar), não do marketplace
      // ✅ IMPORTANTE: Este user_id é o mp_user_id que será usado como collector_id
    });

    return tokenData;
  }

  /**
   * Busca informações do usuário no Mercado Pago
   * Opcional - usado apenas para validação
   */
  static async getUserInfo(
    accessToken: string,
    userId: number
  ): Promise<MercadoPagoUser | null> {
    try {
      const response = await fetch(`${MP_API_BASE}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.warn(`Não foi possível buscar informações do usuário: ${response.status}`);
        return null;
      }

      return await response.json() as MercadoPagoUser;
    } catch (error) {
      console.warn("Erro ao buscar informações do usuário:", error);
      return null;
    }
  }

  /**
   * Parse error response from Mercado Pago API
   */
  private static async parseErrorResponse(
    response: typeof Response.prototype
  ): Promise<OAuthErrorResponse> {
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch {
      return {
        error: "unknown_error",
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }
}

// ============================================================================
// BAR REPOSITORY
// ============================================================================

class BarRepository {
  private supabaseUrl: string;
  private serviceKey: string;

  constructor(supabaseUrl: string, serviceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.serviceKey = serviceKey;
  }

  /**
   * Atualiza os tokens OAuth de um bar
   */
  async updateOAuthTokens(barId: string, data: BarUpdateData): Promise<void> {
    if (!barId || barId.trim().length === 0) {
      throw new Error("ID do bar não pode ser vazio");
    }

    console.log(`💾 Salvando tokens OAuth para bar: ${barId}`);

    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/bars?id=eq.${barId}`,
      {
        method: "PATCH",
        headers: {
          apikey: this.serviceKey,
          Authorization: `Bearer ${this.serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao atualizar bar:", {
        status: response.status,
        error: errorText,
      });
      throw new Error(
        `Falha ao atualizar bar no banco: ${response.status} ${errorText}`
      );
    }

    // Verificar se o bar foi encontrado e atualizado
    const updatedBars = await response.json() as Array<{ id: string }>;
    if (!Array.isArray(updatedBars) || updatedBars.length === 0) {
      throw new Error(`Bar com ID ${barId} não encontrado`);
    }

    console.log("✅ Tokens salvos com sucesso no banco de dados");
  }

  /**
   * Verifica se um bar existe
   */
  async barExists(barId: string): Promise<boolean> {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/bars?id=eq.${barId}&select=id`,
      {
        method: "GET",
        headers: {
          apikey: this.serviceKey,
          Authorization: `Bearer ${this.serviceKey}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const bars = await response.json();
    return Array.isArray(bars) && bars.length > 0;
  }
}

// ============================================================================
// OAUTH SERVICE
// ============================================================================

class OAuthService {
  private mpClient: typeof MercadoPagoClient;
  private barRepository: BarRepository;
  private config: OAuthConfig;

  constructor() {
    this.config = getOAuthConfig();
    this.mpClient = MercadoPagoClient;
    this.barRepository = new BarRepository(
      this.config.supabaseUrl,
      this.config.serviceKey
    );
  }

  /**
   * Processa o callback OAuth completo
   */
  async processCallback(params: OAuthCallbackParams): Promise<string> {
    console.log("🔄 Iniciando processamento do callback OAuth");

    // 1. Validar parâmetros
    this.validateParams(params);
    console.log("✅ Parâmetros validados");

    // 2. Verificar se o bar existe
    await this.validateBarExists(params.state);
    console.log(`✅ Bar ${params.state} encontrado no banco`);

    // 3. Trocar code por tokens
    const tokens = await this.mpClient.exchangeCodeForTokens(
      params.code,
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
    console.log("✅ Tokens obtidos do Mercado Pago");

    // 4. (Opcional) Validar tokens buscando info do usuário
    const userInfo = await this.mpClient.getUserInfo(
      tokens.access_token,
      tokens.user_id
    );
    if (userInfo) {
      console.log("✅ Informações do usuário validadas:", {
        userId: userInfo.id,
        email: userInfo.email,
      });
    }

    // 5. Salvar tokens no banco
    // ✅ IMPORTANTE: tokens.access_token é o token do SELLER (bar), não do marketplace
    // ✅ IMPORTANTE: tokens.user_id é o mp_user_id do bar (seller)
    const updateData: BarUpdateData = {
      mp_user_id: String(tokens.user_id), // ✅ Garantir que vem exatamente da resposta OAuth
      seller_access_token: tokens.access_token, // ✅ Token do seller (bar), não do marketplace
      mp_refresh_token: tokens.refresh_token || null,
      mp_oauth_connected_at: new Date().toISOString(),
    };

    console.log("💾 Dados que serão salvos no banco:", {
      mp_user_id: updateData.mp_user_id,
      has_seller_access_token: !!updateData.seller_access_token,
      seller_token_prefix: updateData.seller_access_token?.substring(0, 20) + '...',
      has_refresh_token: !!updateData.mp_refresh_token,
      oauth_connected_at: updateData.mp_oauth_connected_at,
    });

    await this.barRepository.updateOAuthTokens(params.state, updateData);
    
    // ✅ LOG FINAL: Confirmar que os dados foram salvos corretamente
    console.log("✅ OAuth processado com sucesso!");
    console.log("✅ Dados salvos no banco para o bar:", {
      bar_id: params.state,
      mp_user_id: updateData.mp_user_id,
      seller_access_token_saved: !!updateData.seller_access_token,
      // ✅ IMPORTANTE: mp_user_id será usado como collector_id no split payment
      // ✅ IMPORTANTE: seller_access_token é o token do bar (seller), não do marketplace
    });

    // 6. Retornar URL de sucesso
    return `${this.config.frontendUrl}/admin?oauth=success&bar_id=${params.state}`;
  }

  /**
   * Valida os parâmetros do callback
   */
  private validateParams(params: OAuthCallbackParams): void {
    if (params.error) {
      throw new Error(`Erro de autorização do Mercado Pago: ${params.error}`);
    }

    if (!params.code) {
      throw new Error(
        "Código de autorização não encontrado. Certifique-se de seguir o fluxo OAuth completo."
      );
    }

    if (!params.state) {
      throw new Error(
        "State (ID do bar) não fornecido. Certifique-se de iniciar o fluxo OAuth pelo Admin Portal."
      );
    }

    // Validar formato básico do code
    if (params.code.length < 10) {
      throw new Error("Código de autorização inválido");
    }
  }

  /**
   * Valida se o bar existe no banco
   */
  private async validateBarExists(barId: string): Promise<void> {
    const exists = await this.barRepository.barExists(barId);
    if (!exists) {
      throw new Error(`Bar com ID ${barId} não encontrado no banco de dados`);
    }
  }

  /**
   * Gera URL de erro para redirecionamento
   */
  getErrorRedirectUrl(message: string): string {
    return `${this.config.frontendUrl}/admin?oauth=error&message=${encodeURIComponent(message)}`;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Handler principal da Edge Function
 */
serve(async (req: typeof Request.prototype) => {
  // CORS preflight - obrigatório para OAuth callbacks
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔐 OAuth callback recebido:", {
      method: req.method,
      url: req.url,
    });

    // Extrair parâmetros da URL
    let url: InstanceType<typeof URL>;
    try {
      url = new URL(req.url);
    } catch (urlError) {
      console.error("❌ Erro ao fazer parse da URL:", urlError);
      return new Response(
        JSON.stringify({ error: "URL inválida" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const params: OAuthCallbackParams = {
      code: url.searchParams.get("code") || "",
      state: url.searchParams.get("state") || "",
      error: url.searchParams.get("error") || undefined,
    };

    console.log("📥 Parâmetros recebidos do callback:", {
      hasCode: !!params.code,
      codeLength: params.code?.length || 0,
      state: params.state,
      hasError: !!params.error,
      callbackUrl: url.toString(),
    });

    // Validar parâmetros básicos
    if (params.error) {
      console.error("❌ Erro do Mercado Pago:", params.error);
      const config = getOAuthConfig();
      const errorUrl = `${config.frontendUrl}/admin?oauth=error&message=${encodeURIComponent(params.error)}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: errorUrl },
      });
    }

    if (!params.code) {
      console.error("❌ Code não fornecido no callback");
      const config = getOAuthConfig();
      const errorUrl = `${config.frontendUrl}/admin?oauth=error&message=${encodeURIComponent("Código de autorização não fornecido")}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: errorUrl },
      });
    }

    if (!params.state) {
      console.error("❌ State não fornecido no callback");
      const config = getOAuthConfig();
      const errorUrl = `${config.frontendUrl}/admin?oauth=error&message=${encodeURIComponent("State não fornecido")}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: errorUrl },
      });
    }

    // Processar OAuth
    const oauthService = new OAuthService();
    const successUrl = await oauthService.processCallback(params);

    console.log("✅ OAuth processado com sucesso, redirecionando...");
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: successUrl },
    });
  } catch (error: unknown) {
    console.error("❌ Erro ao processar OAuth:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error("❌ Detalhes do erro:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Tentar obter URL de erro (pode falhar se config não estiver disponível)
    let errorUrl: string;
    try {
      const oauthService = new OAuthService();
      errorUrl = oauthService.getErrorRedirectUrl(errorMessage);
    } catch (fallbackError) {
      // Fallback se não conseguir criar OAuthService
      console.error("❌ Erro ao criar OAuthService para fallback:", fallbackError);
      try {
        const config = getOAuthConfig();
        errorUrl = `${config.frontendUrl}/admin?oauth=error&message=${encodeURIComponent(errorMessage)}`;
      } catch (configError) {
        // Último fallback - usar URL hardcoded
        console.error("❌ Erro ao obter config para fallback:", configError);
        errorUrl = `http://localhost:8080/admin?oauth=error&message=${encodeURIComponent(errorMessage)}`;
      }
    }

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: errorUrl },
    });
  }
});

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
  mp_access_token: string;
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
  // @ts-ignore - Deno global
  const clientId = Deno.env.get("MP_CLIENT_ID");
  // @ts-ignore - Deno global
  const clientSecret = Deno.env.get("MP_CLIENT_SECRET");
  // @ts-ignore - Deno global
  const redirectUri = Deno.env.get("MP_REDIRECT_URI");
  // @ts-ignore - Deno global
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
    // @ts-ignore - Deno global
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore - Deno global
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
  if (!clientId || !clientSecret) {
    throw new Error("MP_CLIENT_ID e MP_CLIENT_SECRET são obrigatórios");
  }

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  }

  // Se redirectUri não estiver configurado, gerar automaticamente
  // IMPORTANTE: Deve ser EXATAMENTE o mesmo usado no frontend (sem barra final)
  let finalRedirectUri = redirectUri || `${supabaseUrl}/functions/v1/mp-oauth-callback`;
  finalRedirectUri = finalRedirectUri.trim().replace(/\/$/, ''); // Remove barra final

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: finalRedirectUri,
    frontendUrl: frontendUrl.trim(),
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

    // DEBUG: Logs detalhados para identificar o problema
    console.log("🔄 Trocando code por tokens no Mercado Pago...");
    console.log("📋 Parâmetros enviados:", {
      code: code.trim().substring(0, 20) + '...',
      client_id: clientId.trim().substring(0, 10) + '...',
      redirect_uri: finalRedirectUri,
      redirect_uri_length: finalRedirectUri.length,
      grant_type: "authorization_code",
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

    if (!tokenData.access_token || !tokenData.user_id) {
      console.error("❌ Resposta incompleta do Mercado Pago:", {
        hasAccessToken: !!tokenData.access_token,
        hasUserId: !!tokenData.user_id,
      });
      throw new Error("Resposta do Mercado Pago incompleta: tokens ausentes");
    }

    console.log("✅ Tokens obtidos com sucesso:", {
      userId: tokenData.user_id,
      hasRefreshToken: !!tokenData.refresh_token,
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
    response: Response
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
    const updateData: BarUpdateData = {
      mp_user_id: String(tokens.user_id),
      mp_access_token: tokens.access_token,
      mp_refresh_token: tokens.refresh_token || null,
      mp_oauth_connected_at: new Date().toISOString(),
    };

    await this.barRepository.updateOAuthTokens(params.state, updateData);
    console.log("✅ OAuth processado com sucesso");

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
serve(async (req: Request) => {
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
    const url = new URL(req.url);
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

    // Processar OAuth
    const oauthService = new OAuthService();
    const successUrl = await oauthService.processCallback(params);

    console.log("✅ OAuth processado com sucesso, redirecionando...");
    return Response.redirect(successUrl, 302);
  } catch (error: unknown) {
    console.error("❌ Erro ao processar OAuth:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    // Tentar obter URL de erro (pode falhar se config não estiver disponível)
    let errorUrl: string;
    try {
      const oauthService = new OAuthService();
      errorUrl = oauthService.getErrorRedirectUrl(errorMessage);
    } catch {
      // Fallback se não conseguir criar OAuthService
      // @ts-ignore - Deno global
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:8080";
      errorUrl = `${frontendUrl}/admin?oauth=error&message=${encodeURIComponent(errorMessage)}`;
    }

    return Response.redirect(errorUrl, 302);
  }
});

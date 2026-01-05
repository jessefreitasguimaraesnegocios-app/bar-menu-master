/**
 * Mercado Pago API Client
 * Responsável por todas as interações com a API do Mercado Pago
 */

import type { OAuthTokenResponse, OAuthErrorResponse, MercadoPagoUser } from "./types.ts";

const MP_API_BASE = "https://api.mercadopago.com";

export class MercadoPagoClient {
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

    const params = new URLSearchParams({
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      grant_type: "authorization_code",
      code: code.trim(),
      redirect_uri: redirectUri.trim(),
    });

    console.log("🔄 Trocando code por tokens no Mercado Pago...");

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
        error: errorMessage,
      });
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


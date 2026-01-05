/**
 * OAuth Service
 * Orquestra o fluxo completo de OAuth
 */

import type { OAuthCallbackParams, BarUpdateData } from "./types.ts";
import { MercadoPagoClient } from "./mpClient.ts";
import { BarRepository } from "./barRepository.ts";
import { getOAuthConfig } from "./config.ts";

export class OAuthService {
  private mpClient: typeof MercadoPagoClient;
  private barRepository: BarRepository;
  private config: ReturnType<typeof getOAuthConfig>;

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


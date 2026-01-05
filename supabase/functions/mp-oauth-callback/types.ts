/**
 * Types for Mercado Pago OAuth Flow
 */

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  user_id: number;
  expires_in?: number;
  scope?: string;
}

export interface OAuthErrorResponse {
  error: string;
  error_description?: string;
  message?: string;
}

export interface MercadoPagoUser {
  id: number;
  email?: string;
  nickname?: string;
}

export interface OAuthCallbackParams {
  code: string;
  state: string; // bar_id
  error?: string;
}

export interface BarUpdateData {
  mp_user_id: string;
  mp_access_token: string;
  mp_refresh_token?: string | null;
  mp_oauth_connected_at: string;
}


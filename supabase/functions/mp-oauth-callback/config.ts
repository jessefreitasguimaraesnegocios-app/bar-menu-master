/**
 * Configuration and Environment Variables
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendUrl: string;
  supabaseUrl: string;
  serviceKey: string;
}

export function getOAuthConfig(): OAuthConfig {
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
  const finalRedirectUri = redirectUri || `${supabaseUrl}/functions/v1/mp-oauth-callback`;

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: finalRedirectUri.trim(),
    frontendUrl: frontendUrl.trim(),
    supabaseUrl: supabaseUrl.trim(),
    serviceKey: serviceKey.trim(),
  };
}


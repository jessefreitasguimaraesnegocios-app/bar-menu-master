// Type declarations for Deno runtime in Supabase Edge Functions

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare const console: Console;

declare const fetch: typeof globalThis.fetch;

declare const Response: typeof globalThis.Response;

// Allow imports from Deno URLs
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}


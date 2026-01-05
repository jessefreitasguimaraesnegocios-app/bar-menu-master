/**
 * Edge Function para deletar usuário associado a um bar
 * 
 * Esta função usa service role para deletar usuários do auth.users
 * Apenas admins podem chamar esta função.
 */

// @ts-ignore - Deno runtime
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// @ts-ignore - Deno global
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar autenticação (admin apenas)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente com anon key para verificar usuário
    // @ts-ignore - Deno runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // @ts-ignore - Deno runtime
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    // @ts-ignore - Deno runtime
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar se é admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar role de admin
    if (user.user_metadata?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can delete users" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Obter bar_id do body
    const { bar_id } = await req.json();

    if (!bar_id) {
      return new Response(
        JSON.stringify({ error: "bar_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente admin para deletar usuário
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Buscar usuário associado ao bar
    // Listar todos os usuários e filtrar por user_metadata.bar_id
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      console.error("Erro ao listar usuários:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to list users", details: listError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Encontrar usuário com bar_id correspondente
    const userToDelete = users.users.find(
      (u) => u.user_metadata?.bar_id === bar_id
    );

    if (!userToDelete) {
      // Usuário não encontrado - não é erro, pode não ter usuário associado
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No user found for this bar",
          deleted: false 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Deletar usuário
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      userToDelete.id
    );

    if (deleteError) {
      console.error("Erro ao deletar usuário:", deleteError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete user", 
          details: deleteError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User deleted successfully",
        deleted: true,
        user_id: userToDelete.id,
        email: userToDelete.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro na função delete-bar-user:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


// Utilitários compartilhados pelas Edge Functions do Avaloon Planner.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Cria um client Supabase com o JWT do usuário que chamou a função,
 * para que TODAS as queries respeitem RLS (a função nunca escala
 * privilégios além do que o usuário já tem).
 */
export function supabaseForRequest(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      db: { schema: Deno.env.get("PLANNER_DB_SCHEMA") ?? "planner" },
      global: { headers: { Authorization: authHeader } },
    },
  );
}

/** Carrega o prompt ativo de prompts_config para um código. */
export async function promptAtivo(
  supabase: SupabaseClient,
  codigo: string,
): Promise<{ conteudo: string; versao: string }> {
  const { data, error } = await supabase
    .from("prompts_config")
    .select("conteudo, versao")
    .eq("codigo", codigo)
    .eq("ativo", true)
    .single();
  if (error || !data) {
    throw new Error(`Prompt ativo não encontrado para '${codigo}': ${error?.message}`);
  }
  return data;
}

/** Chama a API Anthropic e devolve o texto da resposta. */
export async function chamarClaude(
  system: string,
  userContent: string,
  maxTokens = 8192,
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API Anthropic retornou ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const texto = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  if (!texto) throw new Error("Resposta vazia da API Anthropic.");
  return texto;
}

/** Remove cercas de markdown e faz parse de JSON com mensagens claras. */
export function extrairJson<T>(texto: string): T {
  let limpo = texto.trim();
  const cerca = limpo.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (cerca) limpo = cerca[1].trim();
  // fallback: recorta do primeiro { ao último }
  if (!limpo.startsWith("{")) {
    const ini = limpo.indexOf("{");
    const fim = limpo.lastIndexOf("}");
    if (ini >= 0 && fim > ini) limpo = limpo.slice(ini, fim + 1);
  }
  try {
    return JSON.parse(limpo) as T;
  } catch (e) {
    throw new Error(`Falha ao parsear JSON da IA: ${(e as Error).message}`);
  }
}

// Edge Function: detectar-lacunas
// Compara o dossiê atual com os schemas dos blocos e devolve as
// perguntas da entrevista guiada + completude por bloco.
import { z } from "npm:zod@3";
import {
  chamarClaude,
  corsHeaders,
  extrairJson,
  jsonResponse,
  promptAtivo,
  supabaseForRequest,
} from "../_shared/mod.ts";

const RespostaSchema = z.object({
  perguntas: z.array(
    z.object({
      bloco: z.string(),
      campo: z.string(),
      pergunta: z.string(),
      prioridade: z.enum(["alta", "media", "baixa"]),
    }),
  ),
  completude_por_bloco: z.record(z.number().min(0).max(100)),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cliente_id } = await req.json();
    if (!cliente_id) return jsonResponse({ error: "cliente_id é obrigatório" }, 400);

    const supabase = supabaseForRequest(req);

    // RLS garante que o usuário só acessa clientes que pode ver.
    const [{ data: cliente, error: erroCliente }, { data: blocos }, { data: dossie }] =
      await Promise.all([
        supabase.from("clientes").select("id, nome, segmento").eq("id", cliente_id).single(),
        supabase.from("blocos_config").select("*").eq("ativo", true).order("ordem"),
        supabase.from("dossie_blocos").select("bloco_codigo, conteudo, updated_at").eq("cliente_id", cliente_id),
      ]);

    if (erroCliente || !cliente) {
      return jsonResponse({ error: "Cliente não encontrado ou sem permissão." }, 404);
    }

    const prompt = await promptAtivo(supabase, "detectar_lacunas");

    const payload = {
      data_hoje: new Date().toISOString().slice(0, 10),
      cliente: { nome: cliente.nome, segmento: cliente.segmento },
      blocos: (blocos ?? []).map((b) => ({
        codigo: b.codigo,
        titulo: b.titulo,
        schema: b.schema,
      })),
      dossie: Object.fromEntries(
        (dossie ?? []).map((d) => [d.bloco_codigo, {
          conteudo: d.conteudo,
          atualizado_em: d.updated_at,
        }]),
      ),
    };

    const texto = await chamarClaude(prompt.conteudo, JSON.stringify(payload), 4096);
    const resposta = RespostaSchema.parse(extrairJson(texto));

    // Persiste a completude calculada em cada bloco do dossiê.
    for (const [bloco, completude] of Object.entries(resposta.completude_por_bloco)) {
      await supabase.from("dossie_blocos").upsert(
        {
          cliente_id,
          bloco_codigo: bloco,
          completude: Math.round(completude),
        },
        { onConflict: "cliente_id,bloco_codigo", ignoreDuplicates: false },
      );
    }

    return jsonResponse({ ...resposta, versao_prompt: `detectar_lacunas:${prompt.versao}` });
  } catch (e) {
    console.error("detectar-lacunas:", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});

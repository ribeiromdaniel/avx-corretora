// Edge Function: gerar-plano
// Envia dossiê + histórico de resultados + camadas ativas ao Claude,
// valida o JSON devolvido e persiste plano + plano_camadas.
import { z } from "npm:zod@3";
import {
  chamarClaude,
  corsHeaders,
  extrairJson,
  jsonResponse,
  promptAtivo,
  supabaseForRequest,
} from "../_shared/mod.ts";

const EntradaSchema = z.object({
  cliente_id: z.string().uuid(),
  periodo_tipo: z.enum(["mensal", "trimestral", "semestral"]),
  periodo_inicio: z.string(),
  periodo_fim: z.string(),
  objetivo_performance: z.record(z.unknown()).default({}),
  objetivo_marca: z.record(z.unknown()).default({}),
});

const RespostaSchema = z.object({
  camadas: z.array(
    z.object({
      camada_codigo: z.string(),
      conteudo: z.union([z.record(z.unknown()), z.null()]),
      justificativa: z.string().optional(),
    }),
  ),
  resumo_executivo: z.string(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const entrada = EntradaSchema.parse(await req.json());
    const supabase = supabaseForRequest(req);

    const [
      { data: cliente, error: erroCliente },
      { data: blocos },
      { data: dossie },
      { data: camadas },
    ] = await Promise.all([
      supabase.from("clientes").select("id, nome, segmento, cidade").eq("id", entrada.cliente_id).single(),
      supabase.from("blocos_config").select("codigo, titulo").eq("ativo", true).order("ordem"),
      supabase.from("dossie_blocos").select("bloco_codigo, conteudo").eq("cliente_id", entrada.cliente_id),
      supabase.from("camadas_config").select("*").eq("ativo", true).order("ordem"),
    ]);

    if (erroCliente || !cliente) {
      return jsonResponse({ error: "Cliente não encontrado ou sem permissão." }, 404);
    }
    if (!camadas || camadas.length === 0) {
      return jsonResponse({ error: "Nenhuma camada de entregável ativa configurada." }, 400);
    }

    // Últimos fechamentos de ciclo do cliente (mais recentes primeiro).
    const { data: resultados } = await supabase
      .from("resultados_ciclo")
      .select("executado, metricas, aprendizados, created_at, planos!inner(cliente_id, periodo_tipo, periodo_inicio, periodo_fim)")
      .eq("planos.cliente_id", entrada.cliente_id)
      .order("created_at", { ascending: false })
      .limit(4);

    const prompt = await promptAtivo(supabase, "gerar_plano");

    const dossieMap = Object.fromEntries((dossie ?? []).map((d) => [d.bloco_codigo, d.conteudo]));
    const payload = {
      cliente: { nome: cliente.nome, segmento: cliente.segmento, cidade: cliente.cidade },
      dossie: (blocos ?? []).map((b) => ({
        bloco: b.codigo,
        titulo: b.titulo,
        conteudo: dossieMap[b.codigo] ?? {},
      })),
      historico_resultados: resultados ?? [],
      camadas: camadas.map((c) => ({
        codigo: c.codigo,
        titulo: c.titulo,
        descricao: c.descricao,
        obrigatoria: c.obrigatoria,
      })),
      periodo: {
        tipo: entrada.periodo_tipo,
        inicio: entrada.periodo_inicio,
        fim: entrada.periodo_fim,
      },
      objetivos: {
        performance: entrada.objetivo_performance,
        marca: entrada.objetivo_marca,
      },
    };

    const texto = await chamarClaude(prompt.conteudo, JSON.stringify(payload), 16384);
    const resposta = RespostaSchema.parse(extrairJson(texto));

    // Toda camada obrigatória precisa vir com conteúdo.
    for (const c of camadas.filter((c) => c.obrigatoria)) {
      const gerada = resposta.camadas.find((g) => g.camada_codigo === c.codigo);
      if (!gerada || gerada.conteudo === null) {
        throw new Error(`A IA não devolveu a camada obrigatória '${c.codigo}'.`);
      }
    }

    const versaoPrompt = `gerar_plano:${prompt.versao}`;

    const { data: plano, error: erroPlano } = await supabase
      .from("planos")
      .insert({
        cliente_id: entrada.cliente_id,
        periodo_tipo: entrada.periodo_tipo,
        periodo_inicio: entrada.periodo_inicio,
        periodo_fim: entrada.periodo_fim,
        status: "rascunho_ia",
        objetivo_performance: entrada.objetivo_performance,
        objetivo_marca: {
          ...entrada.objetivo_marca,
          resumo_executivo: resposta.resumo_executivo,
        },
        gerado_em: new Date().toISOString(),
        versao_prompt: versaoPrompt,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select("id")
      .single();

    if (erroPlano || !plano) {
      throw new Error(`Falha ao criar plano: ${erroPlano?.message}`);
    }

    const ordemPorCodigo = Object.fromEntries(camadas.map((c) => [c.codigo, c.ordem]));
    const linhas = resposta.camadas
      .filter((c) => ordemPorCodigo[c.camada_codigo] !== undefined)
      .map((c) => ({
        plano_id: plano.id,
        camada_codigo: c.camada_codigo,
        conteudo: c.conteudo ?? { conteudo: null, justificativa: c.justificativa ?? "Não aplicável neste período." },
        ordem: ordemPorCodigo[c.camada_codigo],
      }));

    const { error: erroCamadas } = await supabase.from("plano_camadas").insert(linhas);
    if (erroCamadas) throw new Error(`Falha ao gravar camadas: ${erroCamadas.message}`);

    // Geração concluída → plano entra em revisão do GC.
    await supabase.from("planos").update({ status: "em_revisao_gc" }).eq("id", plano.id);

    return jsonResponse({
      plano_id: plano.id,
      versao_prompt: versaoPrompt,
      resumo_executivo: resposta.resumo_executivo,
    });
  } catch (e) {
    console.error("gerar-plano:", e);
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});

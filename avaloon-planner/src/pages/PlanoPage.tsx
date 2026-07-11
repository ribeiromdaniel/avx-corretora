import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CamadaEditor, RenderConteudo } from '../components/CamadaEditor'
import { DemandaExtraButton } from '../components/DemandaExtraButton'
import { Modal } from '../components/Modal'
import { StatusBadge } from '../components/StatusBadge'
import { baixarHtml, gerarHtmlApresentacao } from '../lib/exportHtml'
import { editavelPeloGC, MIN_AJUSTES_GC, podeExportar } from '../lib/status'
import type {
  Aprovacao,
  BlocoConfig,
  CamadaConfig,
  Cliente,
  DossieBloco,
  Plano,
  PlanoCamada,
} from '../lib/types'

export function PlanoPage() {
  const { id } = useParams<{ id: string }>()
  const { ehDiretor } = useAuth()
  const [plano, setPlano] = useState<Plano | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [camadas, setCamadas] = useState<PlanoCamada[]>([])
  const [configs, setConfigs] = useState<CamadaConfig[]>([])
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([])
  const [blocos, setBlocos] = useState<BlocoConfig[]>([])
  const [dossie, setDossie] = useState<DossieBloco[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [ajustesGC, setAjustesGC] = useState('')
  const [editandoCamada, setEditandoCamada] = useState<string | null>(null)
  const [conteudoEditado, setConteudoEditado] = useState<Record<string, unknown>>({})
  const [modalAjustes, setModalAjustes] = useState(false)
  const [comentarioDiretor, setComentarioDiretor] = useState('')
  const [modalFecharCiclo, setModalFecharCiclo] = useState(false)
  const [mostrarDossie, setMostrarDossie] = useState(false)
  // Fechamento de ciclo
  const [execPorCamada, setExecPorCamada] = useState<Record<string, string>>({})
  const [metricasPorCamada, setMetricasPorCamada] = useState<Record<string, string>>({})
  const [aprendizados, setAprendizados] = useState('')

  const carregar = useCallback(async () => {
    if (!id) return
    const { data: p } = await supabase.from('planos').select('*').eq('id', id).single()
    if (!p) {
      setCarregando(false)
      return
    }
    setPlano(p as Plano)
    setAjustesGC((p as Plano).ajustes_gc)
    const [c, pc, cc, ap, bc, db] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', p.cliente_id).single(),
      supabase.from('plano_camadas').select('*').eq('plano_id', id).order('ordem'),
      supabase.from('camadas_config').select('*').order('ordem'),
      supabase
        .from('aprovacoes')
        .select('*, profiles:diretor_id(nome, cargo_diretor)')
        .eq('plano_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('blocos_config').select('*').eq('ativo', true).order('ordem'),
      supabase.from('dossie_blocos').select('*').eq('cliente_id', p.cliente_id),
    ])
    setCliente(c.data as Cliente | null)
    setCamadas((pc.data ?? []) as PlanoCamada[])
    setConfigs((cc.data ?? []) as CamadaConfig[])
    setAprovacoes((ap.data ?? []) as Aprovacao[])
    setBlocos((bc.data ?? []) as BlocoConfig[])
    setDossie((db.data ?? []) as DossieBloco[])
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando) return <p className="py-10 text-center text-neutral-400">Carregando…</p>
  if (!plano || !cliente || !id) {
    return <p className="py-10 text-center text-neutral-400">Plano não encontrado ou sem permissão.</p>
  }

  const configPorCodigo = Object.fromEntries(configs.map((c) => [c.codigo, c]))
  const editavel = editavelPeloGC(plano.status)
  const resumo = (plano.objetivo_marca as Record<string, unknown>)?.resumo_executivo as string | undefined

  const salvarCamada = async (camada: PlanoCamada) => {
    setSalvando(true)
    const { error } = await supabase
      .from('plano_camadas')
      .update({ conteudo: conteudoEditado })
      .eq('id', camada.id)
    if (error) setErro(error.message)
    else {
      setEditandoCamada(null)
      await carregar()
    }
    setSalvando(false)
  }

  const salvarAjustesGC = async () => {
    setSalvando(true)
    const { error } = await supabase.from('planos').update({ ajustes_gc: ajustesGC }).eq('id', id)
    if (error) setErro(error.message)
    setSalvando(false)
  }

  const mudarStatus = async (novoStatus: string) => {
    setSalvando(true)
    setErro('')
    const { error } = await supabase
      .from('planos')
      .update({ status: novoStatus, ajustes_gc: ajustesGC })
      .eq('id', id)
    if (error) setErro(error.message)
    else await carregar()
    setSalvando(false)
  }

  const decidir = async (decisao: 'aprovado' | 'ajustes_solicitados') => {
    setSalvando(true)
    setErro('')
    const { error } = await supabase.rpc('decidir_plano', {
      p_plano_id: id,
      p_decisao: decisao,
      p_comentario: comentarioDiretor,
    })
    if (error) setErro(error.message)
    else {
      setModalAjustes(false)
      setComentarioDiretor('')
      await carregar()
    }
    setSalvando(false)
  }

  const exportar = () => {
    const html = gerarHtmlApresentacao(cliente, plano, camadas, configs)
    baixarHtml(
      `plano-${cliente.nome.toLowerCase().replace(/\s+/g, '-')}-${plano.periodo_inicio}.html`,
      html,
    )
  }

  const fecharCiclo = async () => {
    setSalvando(true)
    setErro('')
    const executado = Object.fromEntries(
      camadas.map((c) => [c.camada_codigo, execPorCamada[c.camada_codigo] ?? '']),
    )
    const metricas = Object.fromEntries(
      camadas.map((c) => [c.camada_codigo, metricasPorCamada[c.camada_codigo] ?? '']),
    )
    const { error } = await supabase.rpc('fechar_ciclo', {
      p_plano_id: id,
      p_executado: executado,
      p_metricas: metricas,
      p_aprendizados: aprendizados,
    })
    if (error) setErro(error.message)
    else {
      setModalFecharCiclo(false)
      await carregar()
    }
    setSalvando(false)
  }

  const dossiePorBloco = Object.fromEntries(dossie.map((d) => [d.bloco_codigo, d]))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={`/clientes/${plano.cliente_id}`} className="text-xs font-semibold text-neutral-400 hover:text-laranja">
            ← {cliente.nome}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold capitalize">
              Plano {plano.periodo_tipo}
            </h1>
            <StatusBadge status={plano.status} />
          </div>
          <p className="text-sm text-neutral-500">
            {plano.periodo_inicio} → {plano.periodo_fim}
            {plano.versao_prompt && (
              <span className="ml-2 text-xs text-neutral-400">gerado com {plano.versao_prompt}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(ehDiretor || plano.status === 'aguardando_aprovacao') && (
            <button className="btn-secondary" onClick={() => setMostrarDossie(!mostrarDossie)}>
              {mostrarDossie ? 'Ocultar dossiê' : 'Ver dossiê ao lado'}
            </button>
          )}
          {podeExportar(plano.status) && (
            <button className="btn-dark" onClick={exportar}>
              Exportar HTML
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className={`grid gap-6 ${mostrarDossie ? 'lg:grid-cols-2' : ''}`}>
        <div className="space-y-4">
          {resumo && (
            <div className="rounded-lg bg-carvao p-5 text-white">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-laranja">
                Resumo executivo
              </div>
              <p className="text-sm leading-relaxed">{resumo}</p>
            </div>
          )}

          {camadas.map((camada) => {
            const cfg = configPorCodigo[camada.camada_codigo]
            const conteudo = camada.conteudo as Record<string, unknown> | null
            const naoAplicavel = !conteudo || conteudo.conteudo === null
            const emEdicao = editandoCamada === camada.camada_codigo
            return (
              <div key={camada.id} className="card p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">
                    {cfg?.titulo ?? camada.camada_codigo}
                    {cfg && !cfg.obrigatoria && (
                      <span className="ml-2 text-xs font-normal text-neutral-400">condicional</span>
                    )}
                  </h2>
                  {editavel && !naoAplicavel && !emEdicao && (
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditandoCamada(camada.camada_codigo)
                        setConteudoEditado(conteudo as Record<string, unknown>)
                      }}
                    >
                      Editar
                    </button>
                  )}
                </div>
                {naoAplicavel ? (
                  <p className="text-sm italic text-neutral-500">
                    Não aplicável neste período.
                    {conteudo?.justificativa ? ` ${conteudo.justificativa}` : ''}
                  </p>
                ) : emEdicao ? (
                  <div>
                    <CamadaEditor conteudo={conteudoEditado} onChange={setConteudoEditado} />
                    <div className="mt-3 flex justify-end gap-2">
                      <button className="btn-secondary" onClick={() => setEditandoCamada(null)}>
                        Cancelar
                      </button>
                      <button className="btn-primary" onClick={() => salvarCamada(camada)} disabled={salvando}>
                        {salvando ? 'Salvando…' : 'Salvar camada'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <RenderConteudo valor={conteudo as never} />
                )}
              </div>
            )
          })}

          {/* Revisão do GC */}
          {editavel && (
            <div className="card border-l-4 border-l-laranja p-5">
              <h2 className="font-display text-lg font-bold">Ajustes do GC</h2>
              <p className="mb-3 text-xs text-neutral-500">
                Obrigatório antes de enviar para aprovação: registre o que você revisou,
                o que mudou e por quê (mínimo {MIN_AJUSTES_GC} caracteres).
              </p>
              <textarea
                className="input min-h-32"
                value={ajustesGC}
                onChange={(e) => setAjustesGC(e.target.value)}
                onBlur={salvarAjustesGC}
                placeholder="ex.: Ajustei a meta de leads de 150 para 120 porque o time comercial do cliente só tem 2 pessoas…"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs font-semibold ${ajustesGC.trim().length >= MIN_AJUSTES_GC ? 'text-green-600' : 'text-neutral-400'}`}>
                  {ajustesGC.trim().length}/{MIN_AJUSTES_GC} caracteres
                </span>
                <button
                  className="btn-primary"
                  disabled={ajustesGC.trim().length < MIN_AJUSTES_GC || salvando}
                  onClick={() => mudarStatus('aguardando_aprovacao')}
                >
                  Enviar para aprovação
                </button>
              </div>
            </div>
          )}

          {/* Decisão do diretor */}
          {plano.status === 'aguardando_aprovacao' && ehDiretor && (
            <div className="card border-l-4 border-l-laranja p-5">
              <h2 className="mb-1 font-display text-lg font-bold">Decisão de diretoria</h2>
              <p className="mb-3 text-xs text-neutral-500">
                Basta a decisão de um diretor. Ao solicitar ajustes, o comentário é
                obrigatório e o plano volta ao GC.
              </p>
              {plano.ajustes_gc && (
                <div className="mb-3 rounded bg-neutral-50 p-3">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                    O que o GC revisou
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-neutral-700">{plano.ajustes_gc}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={() => decidir('aprovado')} disabled={salvando}>
                  Aprovar plano
                </button>
                <button className="btn-secondary" onClick={() => setModalAjustes(true)} disabled={salvando}>
                  Solicitar ajustes
                </button>
              </div>
            </div>
          )}

          {/* Progressão pós-aprovação */}
          {plano.status === 'aprovado' && (
            <button className="btn-dark" onClick={() => mudarStatus('apresentado_cliente')} disabled={salvando}>
              Marcar como apresentado ao cliente
            </button>
          )}
          {plano.status === 'apresentado_cliente' && (
            <button className="btn-dark" onClick={() => mudarStatus('em_execucao')} disabled={salvando}>
              Iniciar execução
            </button>
          )}
          {plano.status === 'em_execucao' && (
            <button className="btn-primary" onClick={() => setModalFecharCiclo(true)}>
              Fechar ciclo (resultados reais)
            </button>
          )}

          {/* Trilha de decisões */}
          {aprovacoes.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-display text-lg font-bold">Histórico de decisões</h2>
              <div className="space-y-3">
                {aprovacoes.map((a) => (
                  <div key={a.id} className="border-l-2 border-neutral-200 pl-3">
                    <div className="text-sm">
                      <span className="font-semibold">{a.profiles?.nome ?? 'Diretor'}</span>
                      {a.profiles?.cargo_diretor && (
                        <span className="text-neutral-400"> · {a.profiles.cargo_diretor}</span>
                      )}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${a.decisao === 'aprovado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {a.decisao === 'aprovado' ? 'aprovou' : 'pediu ajustes'}
                      </span>
                    </div>
                    {a.comentario && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{a.comentario}</p>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {new Date(a.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Split view: dossiê ao lado (fila de aprovação) */}
        {mostrarDossie && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Dossiê de {cliente.nome}</h2>
            {blocos.map((b) => {
              const d = dossiePorBloco[b.codigo]
              return (
                <div key={b.codigo} className="card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold">{b.titulo}</h3>
                    <span className="text-xs font-semibold text-neutral-400">{d?.completude ?? 0}%</span>
                  </div>
                  {d && Object.keys(d.conteudo).length > 0 ? (
                    <RenderConteudo valor={d.conteudo as never} />
                  ) : (
                    <p className="text-sm italic text-neutral-400">vazio</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: solicitar ajustes */}
      <Modal titulo="Solicitar ajustes" aberto={modalAjustes} onFechar={() => setModalAjustes(false)}>
        <p className="mb-3 text-sm text-neutral-500">
          O comentário é obrigatório e vai orientar a revisão do GC.
        </p>
        <textarea
          className="input min-h-28"
          value={comentarioDiretor}
          onChange={(e) => setComentarioDiretor(e.target.value)}
          placeholder="O que precisa mudar e por quê…"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setModalAjustes(false)}>Cancelar</button>
          <button
            className="btn-primary"
            disabled={!comentarioDiretor.trim() || salvando}
            onClick={() => decidir('ajustes_solicitados')}
          >
            Devolver ao GC
          </button>
        </div>
      </Modal>

      {/* Modal: fechamento de ciclo */}
      <Modal titulo="Fechamento de ciclo" aberto={modalFecharCiclo} onFechar={() => setModalFecharCiclo(false)} largo>
        <p className="mb-4 text-sm text-neutral-500">
          5 minutos que valem um plano melhor no próximo ciclo. Tudo aqui alimenta
          automaticamente o bloco de histórico do dossiê.
        </p>
        <div className="space-y-4">
          {camadas.map((c) => {
            const cfg = configPorCodigo[c.camada_codigo]
            return (
              <div key={c.id} className="rounded border border-neutral-200 p-3">
                <h3 className="mb-2 text-sm font-bold">{cfg?.titulo ?? c.camada_codigo}</h3>
                <label className="label">O que foi executado (vs planejado)</label>
                <textarea
                  className="input mb-2 min-h-16 text-sm"
                  value={execPorCamada[c.camada_codigo] ?? ''}
                  onChange={(e) => setExecPorCamada({ ...execPorCamada, [c.camada_codigo]: e.target.value })}
                />
                <label className="label">Métricas alcançadas (vs metas)</label>
                <textarea
                  className="input min-h-16 text-sm"
                  value={metricasPorCamada[c.camada_codigo] ?? ''}
                  onChange={(e) => setMetricasPorCamada({ ...metricasPorCamada, [c.camada_codigo]: e.target.value })}
                />
              </div>
            )
          })}
          <div>
            <label className="label">Aprendizados do ciclo</label>
            <textarea
              className="input min-h-24"
              value={aprendizados}
              onChange={(e) => setAprendizados(e.target.value)}
              placeholder="O que funcionou (dobrar), o que falhou (evitar), o que testar no próximo ciclo…"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setModalFecharCiclo(false)}>Cancelar</button>
          <button className="btn-primary" onClick={fecharCiclo} disabled={salvando}>
            {salvando ? 'Fechando…' : 'Fechar ciclo'}
          </button>
        </div>
      </Modal>

      <DemandaExtraButton clienteId={plano.cliente_id} planoId={plano.id} />
    </div>
  )
}

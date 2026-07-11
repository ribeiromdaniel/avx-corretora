import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DemandaExtraButton } from '../components/DemandaExtraButton'
import { EntrevistaGuiada } from '../components/EntrevistaGuiada'
import { StatusBadge } from '../components/StatusBadge'
import type {
  BlocoConfig,
  Cliente,
  DemandaExtra,
  DossieBloco,
  Plano,
} from '../lib/types'

const STATUS_DEMANDA: Record<string, string> = {
  registrada: 'bg-laranja-claro text-laranja-escuro',
  atendida: 'bg-green-100 text-green-800',
  negociada: 'bg-blue-100 text-blue-800',
  recusada: 'bg-neutral-200 text-neutral-600',
}

function BlocoCard({
  bloco,
  dossie,
  clienteId,
  onSalvo,
}: {
  bloco: BlocoConfig
  dossie: DossieBloco | undefined
  clienteId: string
  onSalvo: () => void
}) {
  const { profile } = useAuth()
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)

  const conteudo = dossie?.conteudo ?? {}
  const completude = dossie?.completude ?? 0
  const campos = bloco.schema?.campos ?? []
  const ehAutomatico = (chave: string) => chave === 'ciclos_fechados'

  const iniciarEdicao = () => {
    const iniciais: Record<string, string> = {}
    for (const campo of campos) {
      if (ehAutomatico(campo.chave)) continue
      const v = conteudo[campo.chave]
      iniciais[campo.chave] =
        typeof v === 'string' ? v : v ? JSON.stringify(v) : ''
    }
    setValores(iniciais)
    setEditando(true)
    setExpandido(true)
  }

  const salvar = async () => {
    setSalvando(true)
    const novoConteudo: Record<string, unknown> = { ...conteudo }
    for (const [chave, valor] of Object.entries(valores)) {
      if (valor.trim()) novoConteudo[chave] = valor.trim()
      else delete novoConteudo[chave]
    }
    await supabase.from('dossie_blocos').upsert(
      {
        cliente_id: clienteId,
        bloco_codigo: bloco.codigo,
        conteudo: novoConteudo,
        atualizado_por: profile?.id,
      },
      { onConflict: 'cliente_id,bloco_codigo' },
    )
    setSalvando(false)
    setEditando(false)
    onSalvo()
  }

  return (
    <div className="card p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpandido(!expandido)}>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-laranja">
            Bloco {bloco.ordem}
          </div>
          <h3 className="font-display font-bold">{bloco.titulo}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
            <div
              className={`h-full ${completude >= 70 ? 'bg-green-500' : completude >= 40 ? 'bg-laranja' : 'bg-red-400'}`}
              style={{ width: `${completude}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs font-semibold text-neutral-500">{completude}%</span>
        </div>
      </button>

      {expandido && (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
          {campos.map((campo) => {
            const v = conteudo[campo.chave]
            return (
              <div key={campo.chave}>
                <label className="label" title={campo.descricao}>
                  {campo.rotulo}
                  {ehAutomatico(campo.chave) && (
                    <span className="ml-1 normal-case text-neutral-400">(automático)</span>
                  )}
                </label>
                {editando && !ehAutomatico(campo.chave) ? (
                  <textarea
                    className="input min-h-16 text-sm"
                    placeholder={campo.descricao}
                    value={valores[campo.chave] ?? ''}
                    onChange={(e) => setValores({ ...valores, [campo.chave]: e.target.value })}
                  />
                ) : v !== undefined && v !== '' ? (
                  <p className="whitespace-pre-wrap text-sm text-neutral-700">
                    {typeof v === 'string' ? v : JSON.stringify(v, null, 2)}
                  </p>
                ) : (
                  <p className="text-sm italic text-neutral-400">não preenchido</p>
                )}
              </div>
            )
          })}
          <div className="flex justify-end gap-2 pt-1">
            {editando ? (
              <>
                <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
                <button className="btn-primary" onClick={salvar} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar bloco'}
                </button>
              </>
            ) : (
              <button className="btn-secondary" onClick={iniciarEdicao}>Editar</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ClientePage() {
  const { id } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [blocos, setBlocos] = useState<BlocoConfig[]>([])
  const [dossie, setDossie] = useState<DossieBloco[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [demandas, setDemandas] = useState<DemandaExtra[]>([])
  const [entrevistaAberta, setEntrevistaAberta] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!id) return
    const [c, b, d, p, de] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('blocos_config').select('*').eq('ativo', true).order('ordem'),
      supabase.from('dossie_blocos').select('*').eq('cliente_id', id),
      supabase.from('planos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('demandas_extras').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
    ])
    setCliente(c.data as Cliente | null)
    setBlocos((b.data ?? []) as BlocoConfig[])
    setDossie((d.data ?? []) as DossieBloco[])
    setPlanos((p.data ?? []) as Plano[])
    setDemandas((de.data ?? []) as DemandaExtra[])
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando) {
    return <p className="py-10 text-center text-neutral-400">Carregando…</p>
  }
  if (!cliente || !id) {
    return <p className="py-10 text-center text-neutral-400">Cliente não encontrado ou sem permissão.</p>
  }

  const dossiePorBloco = Object.fromEntries(dossie.map((d) => [d.bloco_codigo, d]))
  const completudeGeral = Math.round(
    dossie.reduce((s, d) => s + d.completude, 0) / Math.max(blocos.length, 1),
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="text-xs font-semibold text-neutral-400 hover:text-laranja">← Clientes</Link>
          <h1 className="font-display text-2xl font-extrabold">{cliente.nome}</h1>
          <p className="text-sm text-neutral-500">
            {cliente.segmento || 'sem segmento'} · {cliente.cidade} · dossiê {completudeGeral}% completo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-dark" onClick={() => setEntrevistaAberta(true)}>
            Completar dossiê
          </button>
          <Link to={`/clientes/${id}/gerar-plano`} className="btn-primary">
            Gerar plano
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Dossiê vivo</h2>
          {blocos.map((b) => (
            <BlocoCard
              key={b.codigo}
              bloco={b}
              dossie={dossiePorBloco[b.codigo]}
              clienteId={id}
              onSalvo={carregar}
            />
          ))}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-display text-lg font-bold">Planos</h2>
            {planos.length === 0 ? (
              <p className="card p-4 text-sm text-neutral-400">
                Nenhum plano ainda. Complete o dossiê e gere o primeiro.
              </p>
            ) : (
              <div className="space-y-2">
                {planos.map((p) => (
                  <Link key={p.id} to={`/planos/${p.id}`} className="card flex items-center justify-between gap-2 p-3 hover:border-laranja">
                    <div>
                      <div className="text-sm font-semibold capitalize">{p.periodo_tipo}</div>
                      <div className="text-xs text-neutral-400">
                        {p.periodo_inicio} → {p.periodo_fim}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-bold">
              Demandas extras
              {demandas.filter((d) => d.status === 'registrada').length > 0 && (
                <span className="ml-2 rounded-full bg-laranja-claro px-2 py-0.5 text-xs font-bold text-laranja-escuro">
                  {demandas.filter((d) => d.status === 'registrada').length} abertas
                </span>
              )}
            </h2>
            {demandas.length === 0 ? (
              <p className="card p-4 text-sm text-neutral-400">Nenhuma demanda extra registrada.</p>
            ) : (
              <div className="space-y-2">
                {demandas.map((d) => (
                  <div key={d.id} className="card p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_DEMANDA[d.status]}`}>
                        {d.status}
                      </span>
                      <span className="text-xs text-neutral-400">esforço {d.esforco_estimado}</span>
                    </div>
                    <p className="text-sm text-neutral-700">{d.descricao}</p>
                    {d.solicitante && (
                      <p className="mt-1 text-xs text-neutral-400">Pedido por {d.solicitante}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <EntrevistaGuiada
        clienteId={id}
        blocos={blocos}
        aberto={entrevistaAberta}
        onFechar={() => setEntrevistaAberta(false)}
        onConcluida={carregar}
      />
      <DemandaExtraButton clienteId={id} onRegistrada={carregar} />
    </div>
  )
}

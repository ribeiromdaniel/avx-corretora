import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { DemandaExtra, DemandaStatus } from '../lib/types'

interface DemandaComCliente extends DemandaExtra {
  clientes: { nome: string; segmento: string } | null
}

const STATUS_CORES: Record<DemandaStatus, string> = {
  registrada: 'bg-laranja-claro text-laranja-escuro',
  atendida: 'bg-green-100 text-green-800',
  negociada: 'bg-blue-100 text-blue-800',
  recusada: 'bg-neutral-200 text-neutral-600',
}

const PESO_ESFORCO: Record<string, number> = { baixo: 1, medio: 2, alto: 3 }

/**
 * Visão agregada de demandas extras por cliente — o argumento
 * objetivo de upsell na revisão trimestral do contrato.
 */
export function DemandasPage() {
  const [demandas, setDemandas] = useState<DemandaComCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  const carregar = () =>
    supabase
      .from('demandas_extras')
      .select('*, clientes(nome, segmento)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDemandas((data ?? []) as unknown as DemandaComCliente[])
        setCarregando(false)
      })

  useEffect(() => {
    carregar()
  }, [])

  const mudarStatus = async (id: string, status: DemandaStatus) => {
    await supabase.from('demandas_extras').update({ status }).eq('id', id)
    carregar()
  }

  const porCliente = useMemo(() => {
    const filtradas = filtroStatus
      ? demandas.filter((d) => d.status === filtroStatus)
      : demandas
    const grupos = new Map<string, { nome: string; segmento: string; itens: DemandaComCliente[] }>()
    for (const d of filtradas) {
      const g = grupos.get(d.cliente_id) ?? {
        nome: d.clientes?.nome ?? '—',
        segmento: d.clientes?.segmento ?? '',
        itens: [],
      }
      g.itens.push(d)
      grupos.set(d.cliente_id, g)
    }
    return [...grupos.entries()]
      .map(([clienteId, g]) => ({
        clienteId,
        ...g,
        abertas: g.itens.filter((i) => i.status === 'registrada').length,
        esforco: g.itens.reduce((s, i) => s + (PESO_ESFORCO[i.esforco_estimado] ?? 2), 0),
      }))
      .sort((a, b) => b.esforco - a.esforco)
  }, [demandas, filtroStatus])

  const totais = useMemo(
    () => ({
      total: demandas.length,
      abertas: demandas.filter((d) => d.status === 'registrada').length,
      atendidas: demandas.filter((d) => d.status === 'atendida').length,
    }),
    [demandas],
  )

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Demandas extras</h1>
          <p className="text-sm text-neutral-500">
            Tudo que os clientes pediram fora do escopo planejado — ordenado por
            esforço acumulado. Leve para a revisão trimestral.
          </p>
        </div>
        <select className="input max-w-44" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="registrada">Registradas</option>
          <option value="atendida">Atendidas</option>
          <option value="negociada">Negociadas</option>
          <option value="recusada">Recusadas</option>
        </select>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { rotulo: 'Registradas (abertas)', valor: totais.abertas, destaque: true },
          { rotulo: 'Atendidas sem cobrar', valor: totais.atendidas, destaque: false },
          { rotulo: 'Total no período', valor: totais.total, destaque: false },
        ].map((c) => (
          <div key={c.rotulo} className={`card p-4 ${c.destaque ? 'border-laranja' : ''}`}>
            <div className={`font-display text-2xl font-extrabold ${c.destaque ? 'text-laranja' : ''}`}>
              {c.valor}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {c.rotulo}
            </div>
          </div>
        ))}
      </div>

      {carregando ? (
        <p className="py-10 text-center text-neutral-400">Carregando…</p>
      ) : porCliente.length === 0 ? (
        <div className="card p-10 text-center text-neutral-400">
          Nenhuma demanda extra registrada.
        </div>
      ) : (
        <div className="space-y-2">
          {porCliente.map((g) => (
            <div key={g.clienteId} className="card">
              <button
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                onClick={() => setExpandido(expandido === g.clienteId ? null : g.clienteId)}
              >
                <div>
                  <Link
                    to={`/clientes/${g.clienteId}`}
                    className="font-semibold hover:text-laranja"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {g.nome}
                  </Link>
                  <span className="ml-2 text-xs text-neutral-400">{g.segmento}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  {g.abertas > 0 && (
                    <span className="rounded-full bg-laranja-claro px-2 py-0.5 text-laranja-escuro">
                      {g.abertas} abertas
                    </span>
                  )}
                  <span className="text-neutral-500">{g.itens.length} demandas</span>
                  <span className="text-neutral-400">esforço acumulado: {g.esforco}</span>
                </div>
              </button>
              {expandido === g.clienteId && (
                <div className="space-y-2 border-t border-neutral-100 p-4">
                  {g.itens.map((d) => (
                    <div key={d.id} className="flex flex-wrap items-start justify-between gap-3 rounded border border-neutral-100 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-700">{d.descricao}</p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {d.solicitante && <>pedido por {d.solicitante} · </>}
                          esforço {d.esforco_estimado} ·{' '}
                          {new Date(d.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CORES[d.status]}`}>
                          {d.status}
                        </span>
                        <select
                          className="input max-w-36 py-1 text-xs"
                          value={d.status}
                          onChange={(e) => mudarStatus(d.id, e.target.value as DemandaStatus)}
                        >
                          <option value="registrada">registrada</option>
                          <option value="atendida">atendida</option>
                          <option value="negociada">negociada</option>
                          <option value="recusada">recusada</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

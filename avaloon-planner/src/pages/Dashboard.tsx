import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Modal } from '../components/Modal'
import { StatusBadge } from '../components/StatusBadge'
import type { Cliente, PlanoStatus, Profile } from '../lib/types'

interface LinhaCliente extends Cliente {
  completude: number
  plano_status: PlanoStatus | null
  plano_id: string | null
  demandas_abertas: number
  gc_nome: string
}

export function Dashboard() {
  const { profile, ehDiretor } = useAuth()
  const [linhas, setLinhas] = useState<LinhaCliente[]>([])
  const [gcs, setGcs] = useState<Profile[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroGC, setFiltroGC] = useState('')
  const [filtroSegmento, setFiltroSegmento] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [modalNovo, setModalNovo] = useState(false)
  const [novo, setNovo] = useState({ nome: '', segmento: '', cidade: 'Montes Claros/MG', gc: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = async () => {
    setCarregando(true)
    const [
      { data: clientes },
      { data: perfis },
      { data: blocos },
      { data: dossies },
      { data: planos },
      { data: demandas },
    ] = await Promise.all([
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('profiles').select('*').order('nome'),
      supabase.from('blocos_config').select('codigo').eq('ativo', true),
      supabase.from('dossie_blocos').select('cliente_id, completude'),
      supabase
        .from('planos')
        .select('id, cliente_id, status, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('demandas_extras').select('cliente_id, status').eq('status', 'registrada'),
    ])

    const totalBlocos = Math.max(blocos?.length ?? 7, 1)
    const nomePorId = Object.fromEntries((perfis ?? []).map((p) => [p.id, p.nome]))
    const planoPorCliente = new Map<string, { id: string; status: PlanoStatus }>()
    for (const p of planos ?? []) {
      if (!planoPorCliente.has(p.cliente_id)) {
        planoPorCliente.set(p.cliente_id, { id: p.id, status: p.status as PlanoStatus })
      }
    }
    const somaPorCliente = new Map<string, number>()
    for (const d of dossies ?? []) {
      somaPorCliente.set(d.cliente_id, (somaPorCliente.get(d.cliente_id) ?? 0) + d.completude)
    }
    const demandasPorCliente = new Map<string, number>()
    for (const d of demandas ?? []) {
      demandasPorCliente.set(d.cliente_id, (demandasPorCliente.get(d.cliente_id) ?? 0) + 1)
    }

    setGcs((perfis ?? []) as Profile[])
    setLinhas(
      ((clientes ?? []) as Cliente[]).map((c) => ({
        ...c,
        completude: Math.round((somaPorCliente.get(c.id) ?? 0) / totalBlocos),
        plano_status: planoPorCliente.get(c.id)?.status ?? null,
        plano_id: planoPorCliente.get(c.id)?.id ?? null,
        demandas_abertas: demandasPorCliente.get(c.id) ?? 0,
        gc_nome: c.gc_responsavel ? (nomePorId[c.gc_responsavel] ?? '—') : '—',
      })),
    )
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const segmentos = useMemo(
    () => [...new Set(linhas.map((l) => l.segmento).filter(Boolean))].sort(),
    [linhas],
  )

  const filtradas = linhas.filter(
    (l) =>
      (!filtroGC || l.gc_responsavel === filtroGC) &&
      (!filtroSegmento || l.segmento === filtroSegmento) &&
      (!filtroStatus || l.status === filtroStatus) &&
      (!busca || l.nome.toLowerCase().includes(busca.toLowerCase())),
  )

  const criarCliente = async (e: FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('clientes').insert({
      nome: novo.nome,
      segmento: novo.segmento,
      cidade: novo.cidade,
      gc_responsavel: novo.gc || profile?.id,
    })
    if (error) {
      setErro(error.message)
    } else {
      setModalNovo(false)
      setNovo({ nome: '', segmento: '', cidade: 'Montes Claros/MG', gc: '' })
      carregar()
    }
    setSalvando(false)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Clientes</h1>
          <p className="text-sm text-neutral-500">
            {ehDiretor ? 'Todos os clientes da Avaloon' : 'Seus clientes'} ·{' '}
            {filtradas.length} de {linhas.length}
          </p>
        </div>
        <button onClick={() => setModalNovo(true)} className="btn-primary">
          + Novo cliente
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="input max-w-52"
          placeholder="Buscar cliente…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {ehDiretor && (
          <select className="input max-w-48" value={filtroGC} onChange={(e) => setFiltroGC(e.target.value)}>
            <option value="">Todos os GCs</option>
            {gcs.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
        )}
        <select className="input max-w-48" value={filtroSegmento} onChange={(e) => setFiltroSegmento(e.target.value)}>
          <option value="">Todos os segmentos</option>
          {segmentos.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input max-w-40" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="pausado">Pausado</option>
          <option value="encerrado">Encerrado</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Dossiê</th>
              <th className="px-4 py-3">Plano vigente</th>
              <th className="px-4 py-3">GC</th>
              <th className="px-4 py-3">Demandas abertas</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Carregando…</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-neutral-400">Nenhum cliente encontrado.</td></tr>
            ) : (
              filtradas.map((l) => (
                <tr key={l.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link to={`/clientes/${l.id}`} className="font-semibold text-carvao hover:text-laranja">
                      {l.nome}
                    </Link>
                    <div className="text-xs text-neutral-400">
                      {l.segmento || 'sem segmento'}
                      {l.status !== 'ativo' && (
                        <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 font-semibold text-neutral-600">
                          {l.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className={`h-full rounded-full ${l.completude >= 70 ? 'bg-green-500' : l.completude >= 40 ? 'bg-laranja' : 'bg-red-400'}`}
                          style={{ width: `${l.completude}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-neutral-600">{l.completude}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.plano_status && l.plano_id ? (
                      <Link to={`/planos/${l.plano_id}`}>
                        <StatusBadge status={l.plano_status} />
                      </Link>
                    ) : (
                      <span className="text-xs text-neutral-400">sem plano</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{l.gc_nome}</td>
                  <td className="px-4 py-3">
                    {l.demandas_abertas > 0 ? (
                      <span className="rounded-full bg-laranja-claro px-2 py-0.5 text-xs font-bold text-laranja-escuro">
                        {l.demandas_abertas}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal titulo="Novo cliente" aberto={modalNovo} onFechar={() => setModalNovo(false)}>
        <form onSubmit={criarCliente} className="space-y-3">
          <div>
            <label className="label">Nome</label>
            <input className="input" required value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Segmento</label>
            <input className="input" placeholder="ex.: clínica odontológica" value={novo.segmento} onChange={(e) => setNovo({ ...novo, segmento: e.target.value })} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={novo.cidade} onChange={(e) => setNovo({ ...novo, cidade: e.target.value })} />
          </div>
          {ehDiretor && (
            <div>
              <label className="label">GC responsável</label>
              <select className="input" value={novo.gc} onChange={(e) => setNovo({ ...novo, gc: e.target.value })}>
                <option value="">Eu mesmo</option>
                {gcs.map((g) => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
            </div>
          )}
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalNovo(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

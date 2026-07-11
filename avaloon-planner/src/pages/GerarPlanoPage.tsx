import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CamadaConfig, Cliente, PeriodoTipo } from '../lib/types'

const MESES_POR_TIPO: Record<PeriodoTipo, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
}

function somarMeses(dataIso: string, meses: number): string {
  const d = new Date(dataIso + 'T00:00:00')
  d.setMonth(d.getMonth() + meses)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function GerarPlanoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [camadas, setCamadas] = useState<CamadaConfig[]>([])
  const [tipo, setTipo] = useState<PeriodoTipo>('mensal')
  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [inicio, setInicio] = useState(hoje)
  const [objPerformance, setObjPerformance] = useState('')
  const [metaPerformance, setMetaPerformance] = useState('')
  const [objMarca, setObjMarca] = useState('')
  const [indicadorMarca, setIndicadorMarca] = useState('')
  const [gerando, setGerando] = useState(false)
  const [etapa, setEtapa] = useState(0)
  const [erro, setErro] = useState('')

  const fim = useMemo(() => somarMeses(inicio, MESES_POR_TIPO[tipo]), [inicio, tipo])

  useEffect(() => {
    if (!id) return
    supabase.from('clientes').select('*').eq('id', id).single()
      .then(({ data }) => setCliente(data as Cliente | null))
    supabase.from('camadas_config').select('*').eq('ativo', true).order('ordem')
      .then(({ data }) => setCamadas((data ?? []) as CamadaConfig[]))
  }, [id])

  // Loading com progresso simulado por camada — a geração é uma
  // chamada única; a etapa avança em ritmo estimado enquanto espera.
  useEffect(() => {
    if (!gerando) return
    setEtapa(0)
    const intervalo = setInterval(() => {
      setEtapa((e) => Math.min(e + 1, camadas.length - 1))
    }, 12_000)
    return () => clearInterval(intervalo)
  }, [gerando, camadas.length])

  const gerar = async () => {
    if (!objPerformance.trim() && !objMarca.trim()) {
      setErro('Preencha pelo menos um dos dois objetivos (performance ou marca).')
      return
    }
    setErro('')
    setGerando(true)
    const { data, error } = await supabase.functions.invoke('gerar-plano', {
      body: {
        cliente_id: id,
        periodo_tipo: tipo,
        periodo_inicio: inicio,
        periodo_fim: fim,
        objetivo_performance: objPerformance.trim()
          ? { descricao: objPerformance.trim(), meta: metaPerformance.trim() }
          : {},
        objetivo_marca: objMarca.trim()
          ? { descricao: objMarca.trim(), indicador: indicadorMarca.trim() }
          : {},
      },
    })
    if (error || data?.error) {
      setErro(data?.error ?? error?.message ?? 'Falha ao gerar o plano.')
      setGerando(false)
      return
    }
    navigate(`/planos/${data.plano_id}`)
  }

  if (!cliente || !id) {
    return <p className="py-10 text-center text-neutral-400">Carregando…</p>
  }

  if (gerando) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-[3px] border-laranja border-t-transparent" />
        <h2 className="mb-2 font-display text-xl font-extrabold">
          Gerando plano para {cliente.nome}
        </h2>
        <p className="mb-8 text-sm text-neutral-500">
          A IA está cruzando o dossiê com o histórico de resultados. Leva ~1 minuto.
        </p>
        <div className="space-y-2 text-left">
          {camadas.map((c, i) => (
            <div key={c.codigo} className={`card flex items-center gap-3 p-3 text-sm ${i <= etapa ? '' : 'opacity-40'}`}>
              {i < etapa ? (
                <span className="text-green-600">✓</span>
              ) : i === etapa ? (
                <span className="h-3 w-3 animate-pulse rounded-full bg-laranja" />
              ) : (
                <span className="h-3 w-3 rounded-full bg-neutral-300" />
              )}
              <span className="font-semibold">{c.titulo}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/clientes/${id}`} className="text-xs font-semibold text-neutral-400 hover:text-laranja">
        ← {cliente.nome}
      </Link>
      <h1 className="mb-1 font-display text-2xl font-extrabold">Gerar plano de campanha</h1>
      <p className="mb-6 text-sm text-neutral-500">
        O plano nasce do dossiê + histórico de resultados, nas {camadas.length} camadas ativas.
      </p>

      <div className="card space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Período</label>
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as PeriodoTipo)}>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
            </select>
          </div>
          <div>
            <label className="label">Início</label>
            <input type="date" className="input" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            <p className="mt-1 text-xs text-neutral-400">Fim: {fim}</p>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <h3 className="mb-1 font-display font-bold">Objetivo de performance</h3>
          <p className="mb-2 text-xs text-neutral-500">Vendas, leads ou agenda — com meta numérica.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="ex.: gerar leads de implante" value={objPerformance} onChange={(e) => setObjPerformance(e.target.value)} />
            <input className="input" placeholder="meta: ex. 120 leads/mês" value={metaPerformance} onChange={(e) => setMetaPerformance(e.target.value)} />
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <h3 className="mb-1 font-display font-bold">Objetivo de marca</h3>
          <p className="mb-2 text-xs text-neutral-500">Reconhecimento, lembrança ou posicionamento — com indicador.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="ex.: ser a 1ª lembrança em odontologia estética" value={objMarca} onChange={(e) => setObjMarca(e.target.value)} />
            <input className="input" placeholder="indicador: ex. busca pela marca +40%" value={indicadorMarca} onChange={(e) => setIndicadorMarca(e.target.value)} />
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <h3 className="mb-2 font-display font-bold">Camadas do plano</h3>
          <div className="space-y-1.5">
            {camadas.map((c) => (
              <div key={c.codigo} className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${c.obrigatoria ? 'bg-laranja' : 'bg-neutral-300'}`} />
                <span className="font-medium">{c.titulo}</span>
                <span className="text-xs text-neutral-400">
                  {c.obrigatoria ? 'obrigatória' : 'condicional — a IA decide pelo perfil/verba'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}

        <button className="btn-primary w-full" onClick={gerar}>
          Gerar plano com IA
        </button>
      </div>
    </div>
  )
}

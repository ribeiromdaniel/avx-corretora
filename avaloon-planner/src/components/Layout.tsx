import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge } from './StatusBadge'
import type { PlanoStatus } from '../lib/types'

interface Notificacao {
  plano_id: string
  cliente_nome: string
  status: PlanoStatus
}

function Sino() {
  const { ehDiretor } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [itens, setItens] = useState<Notificacao[]>([])

  useEffect(() => {
    // Diretor: planos aguardando aprovação. GC: decisões recebidas
    // (ajustes solicitados ou aprovado) nos planos dos seus clientes.
    const statusAlvo = ehDiretor
      ? ['aguardando_aprovacao']
      : ['ajustes_solicitados', 'aprovado']
    const carregar = async () => {
      const { data } = await supabase
        .from('planos')
        .select('id, status, clientes(nome)')
        .in('status', statusAlvo)
        .order('updated_at', { ascending: false })
        .limit(15)
      setItens(
        (data ?? []).map((p) => ({
          plano_id: p.id as string,
          status: p.status as PlanoStatus,
          cliente_nome:
            (p.clientes as unknown as { nome: string } | null)?.nome ?? '—',
        })),
      )
    }
    carregar()
    const intervalo = setInterval(carregar, 60_000)
    return () => clearInterval(intervalo)
  }, [ehDiretor])

  return (
    <div className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="relative rounded p-2 text-neutral-300 hover:bg-carvao-claro hover:text-white"
        aria-label="Notificações"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {itens.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-laranja px-1 text-[10px] font-bold text-white">
            {itens.length}
          </span>
        )}
      </button>
      {aberto && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {ehDiretor ? 'Planos aguardando decisão' : 'Decisões nos seus planos'}
          </div>
          {itens.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-400">
              Nada por aqui.
            </div>
          ) : (
            itens.map((n) => (
              <Link
                key={n.plano_id}
                to={`/planos/${n.plano_id}`}
                onClick={() => setAberto(false)}
                className="flex items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium text-carvao">{n.cliente_nome}</span>
                <StatusBadge status={n.status} />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function Layout() {
  const { profile, ehDiretor, ehAdmin, sair } = useAuth()

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
      isActive ? 'bg-laranja text-white' : 'text-neutral-300 hover:bg-carvao-claro hover:text-white'
    }`

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-carvao">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="mr-2 flex items-baseline gap-1.5">
            <span className="font-display text-lg font-extrabold tracking-widest text-white">
              AVALOON
            </span>
            <span className="text-sm font-semibold text-laranja">Planner</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={linkClasses}>
              Clientes
            </NavLink>
            {ehDiretor && (
              <>
                <NavLink to="/aprovacoes" className={linkClasses}>
                  Aprovações
                </NavLink>
                <NavLink to="/demandas" className={linkClasses}>
                  Demandas
                </NavLink>
              </>
            )}
            {ehAdmin && (
              <NavLink to="/admin" className={linkClasses}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Sino />
            <span className="hidden text-sm text-neutral-400 sm:block">
              {profile?.nome}
              <span className="ml-1.5 text-xs text-neutral-500">
                ({profile?.papel === 'gerente_conta' ? 'GC' : profile?.cargo_diretor || profile?.papel})
              </span>
            </span>
            <button
              onClick={sair}
              className="rounded px-2 py-1 text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

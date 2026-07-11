import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import type { Plano } from '../lib/types'

interface PlanoFila extends Plano {
  clientes: { nome: string; segmento: string } | null
  criador: { nome: string } | null
}

export function AprovacoesPage() {
  const [fila, setFila] = useState<PlanoFila[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase
      .from('planos')
      .select('*, clientes(nome, segmento), criador:created_by(nome)')
      .eq('status', 'aguardando_aprovacao')
      .order('updated_at', { ascending: true })
      .then(({ data }) => {
        setFila((data ?? []) as unknown as PlanoFila[])
        setCarregando(false)
      })
  }, [])

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold">Fila de aprovação</h1>
      <p className="mb-5 text-sm text-neutral-500">
        Planos aguardando decisão de diretoria. Basta um diretor decidir.
      </p>

      {carregando ? (
        <p className="py-10 text-center text-neutral-400">Carregando…</p>
      ) : fila.length === 0 ? (
        <div className="card p-10 text-center text-neutral-400">
          Fila limpa. Nenhum plano aguardando aprovação.
        </div>
      ) : (
        <div className="space-y-2">
          {fila.map((p) => (
            <Link
              key={p.id}
              to={`/planos/${p.id}`}
              className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-laranja"
            >
              <div>
                <div className="font-semibold">{p.clientes?.nome ?? '—'}</div>
                <div className="text-xs text-neutral-400">
                  {p.clientes?.segmento} · plano {p.periodo_tipo} · {p.periodo_inicio} → {p.periodo_fim}
                  {p.criador?.nome && <> · GC: {p.criador.nome}</>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">
                  aguardando desde {new Date(p.updated_at).toLocaleDateString('pt-BR')}
                </span>
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

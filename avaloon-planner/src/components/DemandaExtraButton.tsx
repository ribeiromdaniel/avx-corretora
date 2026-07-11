import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Modal } from './Modal'
import type { Esforco } from '../lib/types'

/**
 * Botão flutuante "Demanda extra" — disponível em qualquer tela de
 * cliente. Registra pedidos fora do escopo planejado (base do
 * argumento de upsell na revisão trimestral).
 */
export function DemandaExtraButton({
  clienteId,
  planoId,
  onRegistrada,
}: {
  clienteId: string
  planoId?: string | null
  onRegistrada?: () => void
}) {
  const { profile } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [esforco, setEsforco] = useState<Esforco>('medio')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const registrar = async (e: FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('demandas_extras').insert({
      cliente_id: clienteId,
      plano_id: planoId ?? null,
      descricao,
      solicitante,
      esforco_estimado: esforco,
      created_by: profile?.id,
    })
    if (error) {
      setErro(error.message)
    } else {
      setAberto(false)
      setDescricao('')
      setSolicitante('')
      setEsforco('medio')
      onRegistrada?.()
    }
    setSalvando(false)
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-carvao px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-carvao-claro"
      >
        <span className="text-laranja">+</span> Demanda extra
      </button>
      <Modal titulo="Registrar demanda extra" aberto={aberto} onFechar={() => setAberto(false)}>
        <form onSubmit={registrar} className="space-y-3">
          <p className="text-xs text-neutral-500">
            Pedido do cliente fora do escopo planejado. Fica registrado para a
            revisão trimestral do contrato.
          </p>
          <div>
            <label className="label">O que o cliente pediu?</label>
            <textarea className="input min-h-24" required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <label className="label">Quem pediu</label>
            <input className="input" placeholder="ex.: Dr. Marcos (sócio)" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} />
          </div>
          <div>
            <label className="label">Esforço estimado</label>
            <select className="input" value={esforco} onChange={(e) => setEsforco(e.target.value as Esforco)}>
              <option value="baixo">Baixo</option>
              <option value="medio">Médio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setAberto(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Registrando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

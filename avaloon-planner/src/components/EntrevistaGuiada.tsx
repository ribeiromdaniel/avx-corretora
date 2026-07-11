import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Modal } from './Modal'
import type { BlocoConfig, PerguntaLacuna } from '../lib/types'

const CORES_PRIORIDADE = {
  alta: 'bg-laranja-claro text-laranja-escuro',
  media: 'bg-blue-50 text-blue-700',
  baixa: 'bg-neutral-100 text-neutral-500',
} as const

/**
 * Entrevista guiada: chama a Edge Function detectar-lacunas e conduz
 * o GC pergunta a pergunta. As respostas são mescladas no conteúdo
 * dos blocos do dossiê ao final.
 */
export function EntrevistaGuiada({
  clienteId,
  blocos,
  aberto,
  onFechar,
  onConcluida,
}: {
  clienteId: string
  blocos: BlocoConfig[]
  aberto: boolean
  onFechar: () => void
  onConcluida: () => void
}) {
  const { profile } = useAuth()
  const [fase, setFase] = useState<'carregando' | 'entrevista' | 'salvando' | 'completo' | 'erro'>('carregando')
  const [erro, setErro] = useState('')
  const [perguntas, setPerguntas] = useState<PerguntaLacuna[]>([])
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [respostaAtual, setRespostaAtual] = useState('')

  useEffect(() => {
    if (!aberto) return
    setFase('carregando')
    setErro('')
    setIndice(0)
    setRespostas({})
    setRespostaAtual('')
    supabase.functions
      .invoke('detectar-lacunas', { body: { cliente_id: clienteId } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          setErro(data?.error ?? error?.message ?? 'Falha ao detectar lacunas.')
          setFase('erro')
          return
        }
        const qs = (data.perguntas ?? []) as PerguntaLacuna[]
        if (qs.length === 0) {
          setFase('completo')
        } else {
          setPerguntas(qs)
          setFase('entrevista')
        }
      })
  }, [aberto, clienteId])

  const tituloBloco = (codigo: string) =>
    blocos.find((b) => b.codigo === codigo)?.titulo ?? codigo

  const avancar = (pular: boolean) => {
    const novas = { ...respostas }
    if (!pular && respostaAtual.trim()) novas[indice] = respostaAtual.trim()
    setRespostas(novas)
    setRespostaAtual('')
    if (indice + 1 < perguntas.length) {
      setIndice(indice + 1)
    } else {
      salvar(novas)
    }
  }

  const salvar = async (todas: Record<number, string>) => {
    setFase('salvando')
    // Agrupa respostas por bloco e mescla no conteúdo existente.
    const porBloco = new Map<string, Record<string, string>>()
    for (const [i, resposta] of Object.entries(todas)) {
      const p = perguntas[Number(i)]
      if (!p) continue
      const atual = porBloco.get(p.bloco) ?? {}
      atual[p.campo] = resposta
      porBloco.set(p.bloco, atual)
    }
    try {
      for (const [bloco, campos] of porBloco) {
        const { data: existente } = await supabase
          .from('dossie_blocos')
          .select('conteudo')
          .eq('cliente_id', clienteId)
          .eq('bloco_codigo', bloco)
          .maybeSingle()
        const conteudo = { ...(existente?.conteudo ?? {}), ...campos }
        const { error } = await supabase.from('dossie_blocos').upsert(
          {
            cliente_id: clienteId,
            bloco_codigo: bloco,
            conteudo,
            atualizado_por: profile?.id,
          },
          { onConflict: 'cliente_id,bloco_codigo' },
        )
        if (error) throw error
      }
      onConcluida()
      onFechar()
    } catch (e) {
      setErro((e as Error).message)
      setFase('erro')
    }
  }

  const pergunta = perguntas[indice]

  return (
    <Modal titulo="Completar dossiê — entrevista guiada" aberto={aberto} onFechar={onFechar} largo>
      {fase === 'carregando' && (
        <div className="py-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-laranja border-t-transparent" />
          <p className="text-sm text-neutral-500">
            A IA está comparando o dossiê atual com o briefing esperado…
          </p>
        </div>
      )}

      {fase === 'erro' && (
        <div className="py-6">
          <p className="mb-4 text-sm text-red-600">{erro}</p>
          <button className="btn-secondary" onClick={onFechar}>Fechar</button>
        </div>
      )}

      {fase === 'completo' && (
        <div className="py-8 text-center">
          <p className="mb-2 font-display text-lg font-bold text-green-700">Dossiê completo ✓</p>
          <p className="mb-4 text-sm text-neutral-500">
            Nenhuma lacuna encontrada. O dossiê está pronto para gerar um plano.
          </p>
          <button className="btn-primary" onClick={() => { onConcluida(); onFechar() }}>
            Entendi
          </button>
        </div>
      )}

      {fase === 'salvando' && (
        <div className="py-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-laranja border-t-transparent" />
          <p className="text-sm text-neutral-500">Salvando respostas no dossiê…</p>
        </div>
      )}

      {fase === 'entrevista' && pergunta && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Pergunta {indice + 1} de {perguntas.length} · {tituloBloco(pergunta.bloco)}
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CORES_PRIORIDADE[pergunta.prioridade]}`}>
              prioridade {pergunta.prioridade}
            </span>
          </div>
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-laranja transition-all"
              style={{ width: `${(indice / perguntas.length) * 100}%` }}
            />
          </div>
          <p className="mb-4 mt-4 text-lg font-semibold text-carvao">{pergunta.pergunta}</p>
          <textarea
            className="input min-h-28"
            placeholder="Resposta do cliente…"
            value={respostaAtual}
            onChange={(e) => setRespostaAtual(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex items-center justify-between">
            <button className="text-sm font-semibold text-neutral-400 hover:text-carvao" onClick={() => avancar(true)}>
              Pular pergunta
            </button>
            <button className="btn-primary" onClick={() => avancar(false)} disabled={!respostaAtual.trim()}>
              {indice + 1 === perguntas.length ? 'Concluir e salvar' : 'Próxima →'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

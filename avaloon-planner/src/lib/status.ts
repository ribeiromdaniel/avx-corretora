import type { PlanoStatus } from './types'

export const STATUS_PLANO: Record<
  PlanoStatus,
  { label: string; classes: string }
> = {
  rascunho_ia: {
    label: 'Rascunho IA',
    classes: 'bg-neutral-200 text-neutral-700',
  },
  em_revisao_gc: {
    label: 'Em revisão do GC',
    classes: 'bg-blue-100 text-blue-800',
  },
  aguardando_aprovacao: {
    label: 'Aguardando aprovação',
    classes: 'bg-laranja-claro text-laranja-escuro border border-laranja',
  },
  ajustes_solicitados: {
    label: 'Ajustes solicitados',
    classes: 'bg-amber-100 text-amber-800',
  },
  aprovado: {
    label: 'Aprovado',
    classes: 'bg-green-100 text-green-800',
  },
  apresentado_cliente: {
    label: 'Apresentado ao cliente',
    classes: 'bg-emerald-100 text-emerald-800',
  },
  em_execucao: {
    label: 'Em execução',
    classes: 'bg-teal-100 text-teal-800',
  },
  ciclo_fechado: {
    label: 'Ciclo fechado',
    classes: 'bg-carvao text-white',
  },
}

/** Plano pode ser exportado/apresentado ao cliente? */
export function podeExportar(status: PlanoStatus): boolean {
  return ['aprovado', 'apresentado_cliente', 'em_execucao', 'ciclo_fechado'].includes(status)
}

/** GC ainda edita o plano neste status? */
export function editavelPeloGC(status: PlanoStatus): boolean {
  return status === 'em_revisao_gc' || status === 'ajustes_solicitados'
}

export const MIN_AJUSTES_GC = 200

export type Papel = 'gerente_conta' | 'diretor' | 'admin'

export interface Profile {
  id: string
  nome: string
  email: string
  papel: Papel
  cargo_diretor: string | null
}

export type ClienteStatus = 'ativo' | 'pausado' | 'encerrado'

export interface Cliente {
  id: string
  nome: string
  segmento: string
  cidade: string
  gc_responsavel: string | null
  status: ClienteStatus
  created_at: string
  updated_at: string
}

export interface CampoBloco {
  chave: string
  rotulo: string
  descricao: string
}

export interface BlocoConfig {
  codigo: string
  titulo: string
  ordem: number
  schema: { campos: CampoBloco[]; regra?: string }
  ativo: boolean
}

export interface DossieBloco {
  id: string
  cliente_id: string
  bloco_codigo: string
  conteudo: Record<string, unknown>
  completude: number
  updated_at: string
}

export interface CamadaConfig {
  codigo: string
  titulo: string
  descricao: string
  obrigatoria: boolean
  ordem: number
  ativo: boolean
}

export type PlanoStatus =
  | 'rascunho_ia'
  | 'em_revisao_gc'
  | 'aguardando_aprovacao'
  | 'ajustes_solicitados'
  | 'aprovado'
  | 'apresentado_cliente'
  | 'em_execucao'
  | 'ciclo_fechado'

export type PeriodoTipo = 'mensal' | 'trimestral' | 'semestral'

export interface Plano {
  id: string
  cliente_id: string
  periodo_tipo: PeriodoTipo
  periodo_inicio: string
  periodo_fim: string
  status: PlanoStatus
  objetivo_performance: Record<string, unknown>
  objetivo_marca: Record<string, unknown>
  ajustes_gc: string
  gerado_em: string | null
  versao_prompt: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PlanoCamada {
  id: string
  plano_id: string
  camada_codigo: string
  conteudo: Record<string, unknown> | null
  ordem: number
}

export interface Aprovacao {
  id: string
  plano_id: string
  diretor_id: string
  decisao: 'aprovado' | 'ajustes_solicitados'
  comentario: string
  created_at: string
  profiles?: { nome: string; cargo_diretor: string | null }
}

export type DemandaStatus = 'registrada' | 'atendida' | 'negociada' | 'recusada'
export type Esforco = 'baixo' | 'medio' | 'alto'

export interface DemandaExtra {
  id: string
  cliente_id: string
  plano_id: string | null
  descricao: string
  solicitante: string
  esforco_estimado: Esforco
  status: DemandaStatus
  created_at: string
}

export interface PromptConfig {
  id: string
  codigo: string
  versao: string
  conteudo: string
  ativo: boolean
  created_at: string
}

export interface PerguntaLacuna {
  bloco: string
  campo: string
  pergunta: string
  prioridade: 'alta' | 'media' | 'baixa'
}

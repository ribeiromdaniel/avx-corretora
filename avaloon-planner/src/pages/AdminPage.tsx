import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Modal } from '../components/Modal'
import type {
  BlocoConfig,
  CamadaConfig,
  Papel,
  Profile,
  PromptConfig,
} from '../lib/types'

type Aba = 'usuarios' | 'blocos' | 'camadas' | 'prompts'

function AbaUsuarios() {
  const [perfis, setPerfis] = useState<Profile[]>([])
  const carregar = () =>
    supabase.from('profiles').select('*').order('nome')
      .then(({ data }) => setPerfis((data ?? []) as Profile[]))
  useEffect(() => {
    carregar()
  }, [])

  const atualizar = async (id: string, campos: Partial<Profile>) => {
    await supabase.from('profiles').update(campos).eq('id', id)
    carregar()
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Papel</th>
            <th className="px-4 py-3">Cargo (diretores)</th>
          </tr>
        </thead>
        <tbody>
          {perfis.map((p) => (
            <tr key={p.id} className="border-b border-neutral-100 last:border-0">
              <td className="px-4 py-3 font-semibold">{p.nome}</td>
              <td className="px-4 py-3 text-neutral-500">{p.email}</td>
              <td className="px-4 py-3">
                <select
                  className="input max-w-44"
                  value={p.papel}
                  onChange={(e) => atualizar(p.id, { papel: e.target.value as Papel })}
                >
                  <option value="gerente_conta">Gerente de conta</option>
                  <option value="diretor">Diretor</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-4 py-3">
                {p.papel !== 'gerente_conta' && (
                  <input
                    className="input max-w-52"
                    defaultValue={p.cargo_diretor ?? ''}
                    placeholder="ex.: Diretor Criativo"
                    onBlur={(e) => atualizar(p.id, { cargo_diretor: e.target.value || null })}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-400">
        Novos usuários são criados no painel do Supabase (Auth → Users) e aparecem
        aqui automaticamente como GC — ajuste o papel após o primeiro login.
      </p>
    </div>
  )
}

function AbaBlocos() {
  const [blocos, setBlocos] = useState<BlocoConfig[]>([])
  const [editando, setEditando] = useState<BlocoConfig | null>(null)
  const [novo, setNovo] = useState(false)
  const [form, setForm] = useState({ codigo: '', titulo: '', ordem: 8, schema: '{"campos": []}' })
  const [erro, setErro] = useState('')

  const carregar = () =>
    supabase.from('blocos_config').select('*').order('ordem')
      .then(({ data }) => setBlocos((data ?? []) as BlocoConfig[]))
  useEffect(() => {
    carregar()
  }, [])

  const abrir = (b: BlocoConfig | null) => {
    setErro('')
    if (b) {
      setEditando(b)
      setForm({ codigo: b.codigo, titulo: b.titulo, ordem: b.ordem, schema: JSON.stringify(b.schema, null, 2) })
    } else {
      setEditando(null)
      setForm({ codigo: '', titulo: '', ordem: blocos.length + 1, schema: '{"campos": [{"chave": "", "rotulo": "", "descricao": ""}]}' })
    }
    setNovo(true)
  }

  const salvar = async () => {
    let schema: unknown
    try {
      schema = JSON.parse(form.schema)
    } catch {
      setErro('Schema não é um JSON válido.')
      return
    }
    const linha = { codigo: form.codigo, titulo: form.titulo, ordem: form.ordem, schema, ativo: true }
    const { error } = editando
      ? await supabase.from('blocos_config').update(linha).eq('codigo', editando.codigo)
      : await supabase.from('blocos_config').insert(linha)
    if (error) setErro(error.message)
    else {
      setNovo(false)
      carregar()
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button className="btn-primary" onClick={() => abrir(null)}>+ Novo bloco</button>
      </div>
      <div className="space-y-2">
        {blocos.map((b) => (
          <div key={b.codigo} className={`card flex items-center justify-between gap-3 p-4 ${b.ativo ? '' : 'opacity-50'}`}>
            <div>
              <span className="font-semibold">{b.ordem}. {b.titulo}</span>
              <span className="ml-2 font-mono text-xs text-neutral-400">{b.codigo}</span>
              <span className="ml-2 text-xs text-neutral-400">
                {(b.schema?.campos ?? []).length} campos
              </span>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => abrir(b)}>Editar</button>
              <button
                className="btn-secondary"
                onClick={async () => {
                  await supabase.from('blocos_config').update({ ativo: !b.ativo }).eq('codigo', b.codigo)
                  carregar()
                }}
              >
                {b.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Modal titulo={editando ? `Editar bloco: ${editando.titulo}` : 'Novo bloco do briefing'} aberto={novo} onFechar={() => setNovo(false)} largo>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Código</label>
              <input className="input font-mono" value={form.codigo} disabled={!!editando} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div>
              <label className="label">Título</label>
              <input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <label className="label">Ordem</label>
              <input type="number" className="input" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Schema (campos esperados, JSON)</label>
            <textarea className="input min-h-64 font-mono text-xs" value={form.schema} onChange={(e) => setForm({ ...form, schema: e.target.value })} />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setNovo(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvar}>Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function AbaCamadas() {
  const [camadas, setCamadas] = useState<CamadaConfig[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ codigo: '', titulo: '', descricao: '', obrigatoria: false, ordem: 5 })
  const [erro, setErro] = useState('')

  const carregar = () =>
    supabase.from('camadas_config').select('*').order('ordem')
      .then(({ data }) => setCamadas((data ?? []) as CamadaConfig[]))
  useEffect(() => {
    carregar()
  }, [])

  const salvar = async () => {
    const { error } = await supabase.from('camadas_config').insert({ ...form, ativo: true })
    if (error) setErro(error.message)
    else {
      setModal(false)
      carregar()
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          className="btn-primary"
          onClick={() => {
            setErro('')
            setForm({ codigo: '', titulo: '', descricao: '', obrigatoria: false, ordem: camadas.length + 1 })
            setModal(true)
          }}
        >
          + Nova camada
        </button>
      </div>
      <div className="space-y-2">
        {camadas.map((c) => (
          <div key={c.codigo} className={`card p-4 ${c.ativo ? '' : 'opacity-50'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold">{c.ordem}. {c.titulo}</span>
                <span className="ml-2 font-mono text-xs text-neutral-400">{c.codigo}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${c.obrigatoria ? 'bg-laranja-claro text-laranja-escuro' : 'bg-neutral-100 text-neutral-500'}`}>
                  {c.obrigatoria ? 'obrigatória' : 'condicional'}
                </span>
              </div>
              <button
                className="btn-secondary"
                onClick={async () => {
                  await supabase.from('camadas_config').update({ ativo: !c.ativo }).eq('codigo', c.codigo)
                  carregar()
                }}
              >
                {c.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{c.descricao}</p>
          </div>
        ))}
      </div>
      <Modal titulo="Nova camada de entregável" aberto={modal} onFechar={() => setModal(false)}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Código</label>
              <input className="input font-mono" placeholder="ex.: email_marketing" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div>
              <label className="label">Título</label>
              <input className="input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Descrição (a IA usa como briefing da camada)</label>
            <textarea className="input min-h-24" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.obrigatoria} onChange={(e) => setForm({ ...form, obrigatoria: e.target.checked })} />
            Camada obrigatória em todo plano
          </label>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvar}>Criar camada</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function AbaPrompts() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([])
  const [editando, setEditando] = useState<PromptConfig | null>(null)
  const [conteudo, setConteudo] = useState('')
  const [versao, setVersao] = useState('')
  const [erro, setErro] = useState('')

  const carregar = () =>
    supabase.from('prompts_config').select('*').order('codigo').order('created_at', { ascending: false })
      .then(({ data }) => setPrompts((data ?? []) as PromptConfig[]))
  useEffect(() => {
    carregar()
  }, [])

  const proximaVersao = (codigo: string) => {
    const nums = prompts
      .filter((p) => p.codigo === codigo)
      .map((p) => Number(p.versao.replace(/\D/g, '')))
      .filter((n) => !Number.isNaN(n))
    return `v${Math.max(0, ...nums) + 1}`
  }

  const salvarNovaVersao = async () => {
    if (!editando) return
    setErro('')
    // Desativa as versões anteriores e ativa a nova, em duas etapas
    // (o índice único garante um ativo por código).
    const { error: e1 } = await supabase
      .from('prompts_config')
      .update({ ativo: false })
      .eq('codigo', editando.codigo)
    if (e1) {
      setErro(e1.message)
      return
    }
    const { error: e2 } = await supabase.from('prompts_config').insert({
      codigo: editando.codigo,
      versao,
      conteudo,
      ativo: true,
    })
    if (e2) setErro(e2.message)
    else {
      setEditando(null)
      carregar()
    }
  }

  const ativar = async (p: PromptConfig) => {
    await supabase.from('prompts_config').update({ ativo: false }).eq('codigo', p.codigo)
    await supabase.from('prompts_config').update({ ativo: true }).eq('id', p.id)
    carregar()
  }

  return (
    <div className="space-y-2">
      {prompts.map((p) => (
        <div key={p.id} className={`card p-4 ${p.ativo ? 'border-laranja' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono text-sm font-semibold">{p.codigo}</span>
              <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-semibold text-neutral-600">{p.versao}</span>
              {p.ativo && (
                <span className="ml-2 rounded-full bg-laranja-claro px-2 py-0.5 text-xs font-bold text-laranja-escuro">ativa</span>
              )}
            </div>
            <div className="flex gap-2">
              {!p.ativo && (
                <button className="btn-secondary" onClick={() => ativar(p)}>Ativar esta versão</button>
              )}
              <button
                className="btn-secondary"
                onClick={() => {
                  setErro('')
                  setEditando(p)
                  setConteudo(p.conteudo)
                  setVersao(proximaVersao(p.codigo))
                }}
              >
                Editar → nova versão
              </button>
            </div>
          </div>
          <pre className="mt-2 max-h-24 overflow-hidden whitespace-pre-wrap text-xs text-neutral-400">
            {p.conteudo.slice(0, 320)}…
          </pre>
        </div>
      ))}

      <Modal
        titulo={`Nova versão de ${editando?.codigo ?? ''}`}
        aberto={!!editando}
        onFechar={() => setEditando(null)}
        largo
      >
        <div className="space-y-3">
          <div>
            <label className="label">Versão</label>
            <input className="input max-w-32 font-mono" value={versao} onChange={(e) => setVersao(e.target.value)} />
          </div>
          <div>
            <label className="label">Conteúdo do prompt</label>
            <textarea className="input min-h-96 font-mono text-xs" value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarNovaVersao}>
              Salvar e ativar {versao}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function AdminPage() {
  const [aba, setAba] = useState<Aba>('usuarios')
  const abas: { id: Aba; titulo: string }[] = [
    { id: 'usuarios', titulo: 'Usuários' },
    { id: 'blocos', titulo: 'Blocos do briefing' },
    { id: 'camadas', titulo: 'Camadas do plano' },
    { id: 'prompts', titulo: 'Prompts' },
  ]

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold">Administração</h1>
      <p className="mb-5 text-sm text-neutral-500">
        Blocos, camadas e prompts são dados — evoluem sem deploy.
      </p>
      <div className="mb-5 flex flex-wrap gap-1 border-b border-neutral-200">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              aba === a.id
                ? 'border-laranja text-carvao'
                : 'border-transparent text-neutral-400 hover:text-carvao'
            }`}
          >
            {a.titulo}
          </button>
        ))}
      </div>
      {aba === 'usuarios' && <AbaUsuarios />}
      {aba === 'blocos' && <AbaBlocos />}
      {aba === 'camadas' && <AbaCamadas />}
      {aba === 'prompts' && <AbaPrompts />}
    </div>
  )
}

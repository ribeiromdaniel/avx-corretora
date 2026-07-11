import { useState } from 'react'

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

function rotulo(chave: string): string {
  return chave.replace(/_/g, ' ')
}

/** Visualização recursiva do conteúdo JSON de uma camada. */
export function RenderConteudo({ valor }: { valor: Json }) {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
    return <p className="whitespace-pre-wrap text-sm text-neutral-700">{String(valor)}</p>
  }
  if (Array.isArray(valor)) {
    return (
      <div className="space-y-2">
        {valor.map((item, i) =>
          typeof item === 'object' && item !== null ? (
            <div key={i} className="border-l-2 border-laranja pl-3">
              <RenderConteudo valor={item} />
            </div>
          ) : (
            <p key={i} className="text-sm text-neutral-700">• {String(item)}</p>
          ),
        )}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {Object.entries(valor).map(([k, v]) =>
        v === null || v === undefined || v === '' ? null : (
          <div key={k}>
            <div className="text-xs font-bold uppercase tracking-wide text-laranja">{rotulo(k)}</div>
            <RenderConteudo valor={v} />
          </div>
        ),
      )}
    </div>
  )
}

function EditorValor({
  valor,
  onChange,
  profundidade,
}: {
  valor: Json
  onChange: (v: Json) => void
  profundidade: number
}) {
  const [jsonBruto, setJsonBruto] = useState<string | null>(null)
  const [jsonErro, setJsonErro] = useState('')

  if (typeof valor === 'string') {
    return (
      <textarea
        className="input min-h-16 text-sm"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  if (typeof valor === 'number' || typeof valor === 'boolean') {
    return (
      <input
        className="input text-sm"
        value={String(valor)}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange(Number.isNaN(n) ? e.target.value : n)
        }}
      />
    )
  }

  // Arrays de objetos (ações, metas): cards editáveis com add/remove.
  if (Array.isArray(valor) && profundidade < 3) {
    return (
      <div className="space-y-2">
        {valor.map((item, i) => (
          <div key={i} className="rounded border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-1 flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold text-red-500 hover:text-red-700"
                onClick={() => onChange(valor.filter((_, j) => j !== i))}
              >
                remover
              </button>
            </div>
            <EditorValor
              valor={item}
              profundidade={profundidade + 1}
              onChange={(novo) => onChange(valor.map((v, j) => (j === i ? novo : v)))}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-semibold text-laranja hover:text-laranja-escuro"
          onClick={() => {
            const modelo = valor[0]
            const novo: Json =
              typeof modelo === 'object' && modelo !== null && !Array.isArray(modelo)
                ? Object.fromEntries(Object.keys(modelo).map((k) => [k, '']))
                : ''
            onChange([...valor, novo])
          }}
        >
          + adicionar item
        </button>
      </div>
    )
  }

  if (typeof valor === 'object' && valor !== null && !Array.isArray(valor) && profundidade < 3) {
    return (
      <div className="space-y-2">
        {Object.entries(valor).map(([k, v]) => (
          <div key={k}>
            <label className="label">{rotulo(k)}</label>
            <EditorValor
              valor={v}
              profundidade={profundidade + 1}
              onChange={(novo) => onChange({ ...valor, [k]: novo })}
            />
          </div>
        ))}
      </div>
    )
  }

  // Fallback: JSON bruto validado.
  const texto = jsonBruto ?? JSON.stringify(valor, null, 2)
  return (
    <div>
      <textarea
        className="input min-h-24 font-mono text-xs"
        value={texto}
        onChange={(e) => {
          setJsonBruto(e.target.value)
          try {
            onChange(JSON.parse(e.target.value))
            setJsonErro('')
          } catch {
            setJsonErro('JSON inválido — a última versão válida será mantida.')
          }
        }}
      />
      {jsonErro && <p className="text-xs text-red-500">{jsonErro}</p>}
    </div>
  )
}

/** Editor camada por camada: cada campo do conteúdo vira um controle. */
export function CamadaEditor({
  conteudo,
  onChange,
}: {
  conteudo: Record<string, unknown>
  onChange: (novo: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-3">
      {Object.entries(conteudo).map(([k, v]) => (
        <div key={k}>
          <label className="label">{rotulo(k)}</label>
          <EditorValor
            valor={v as Json}
            profundidade={0}
            onChange={(novo) => onChange({ ...conteudo, [k]: novo })}
          />
        </div>
      ))}
    </div>
  )
}

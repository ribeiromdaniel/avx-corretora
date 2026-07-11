import type { ReactNode } from 'react'

export function Modal({
  titulo,
  aberto,
  onFechar,
  children,
  largo = false,
}: {
  titulo: string
  aberto: boolean
  onFechar: () => void
  children: ReactNode
  largo?: boolean
}) {
  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onClick={onFechar}
    >
      <div
        className={`card my-8 w-full ${largo ? 'max-w-3xl' : 'max-w-lg'} p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{titulo}</h3>
          <button
            onClick={onFechar}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-carvao"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

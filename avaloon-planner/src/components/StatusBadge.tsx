import { STATUS_PLANO } from '../lib/status'
import type { PlanoStatus } from '../lib/types'

export function StatusBadge({ status }: { status: PlanoStatus }) {
  const meta = STATUS_PLANO[status]
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.classes}`}
    >
      {meta.label}
    </span>
  )
}

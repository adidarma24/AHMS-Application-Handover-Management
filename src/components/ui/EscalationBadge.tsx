import { Siren, TrendingUp } from 'lucide-react'
import { getEscalation } from '../../lib/escalation'
import type { ActionItem } from '../../types'

interface Props {
  item: ActionItem
  size?: 'sm' | 'md'
}

/**
 * Menandai action item overdue yang sudah dianggap "naik level" —
 * baik auto-escalated biasa maupun critical escalation ke Manager O&M.
 * Tidak render apa pun jika item belum memenuhi kriteria eskalasi
 * (lihat lib/escalation.ts).
 */
export default function EscalationBadge({ item, size = 'sm' }: Props) {
  const { escalated, critical, daysOverdue } = getEscalation(item)
  if (!escalated) return null

  const pad = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  const Icon = critical ? Siren : TrendingUp

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${pad} ${
        critical ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 border border-red-200'
      }`}
      title={`Overdue ${daysOverdue} hari`}
    >
      <Icon size={11} />
      {critical ? 'Eskalasi ke Manager O&M' : 'Auto-Escalated'}
    </span>
  )
}
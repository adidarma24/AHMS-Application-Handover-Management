import { useEffect, useState } from 'react'
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Props {
  dueDate: string // 'YYYY-MM-DD'
  status: 'open' | 'completed' | 'overdue'
  variant?: 'inline' | 'big'
  className?: string
}

function daysRemaining(dueDate: string) {
  const due = new Date(`${dueDate}T23:59:59`)
  const now = new Date()
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Live-ticking due date indicator, mirip pola SlaTimer di aplikasi ITSM sebelah:
 * warna berubah otomatis (hijau → kuning → merah) dan berdenyut saat overdue.
 * Refresh tiap menit — cukup untuk resolusi harian tanpa membebani render.
 */
export default function DueDateTimer({ dueDate, status, variant = 'inline', className = '' }: Props) {
  const [days, setDays] = useState(() => daysRemaining(dueDate))

  useEffect(() => {
    if (status === 'completed') return
    const tick = () => setDays(daysRemaining(dueDate))
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [dueDate, status])

  const frozen = status === 'completed'
  const late = !frozen && days < 0
  const dueToday = !frozen && days === 0
  const dueSoon = !frozen && days > 0 && days <= 3

  let color: string
  let bg: string
  let border: string
  let label: string
  if (frozen) {
    color = 'text-gray-400'; bg = 'bg-gray-50'; border = 'border-gray-200'
    label = 'Selesai'
  } else if (late) {
    color = 'text-red-600'; bg = 'bg-red-50'; border = 'border-red-200'
    label = `Terlambat ${Math.abs(days)} hari`
  } else if (dueToday) {
    color = 'text-amber-600'; bg = 'bg-amber-50'; border = 'border-amber-200'
    label = 'Jatuh tempo hari ini'
  } else if (dueSoon) {
    color = 'text-amber-600'; bg = 'bg-amber-50'; border = 'border-amber-200'
    label = `H-${days} hari`
  } else {
    color = 'text-emerald-600'; bg = 'bg-emerald-50'; border = 'border-emerald-200'
    label = `H-${days} hari`
  }

  const Icon = frozen ? CheckCircle2 : late ? AlertTriangle : Clock

  const PulseDot = () => (
    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
    </span>
  )

  if (variant === 'big') {
    return (
      <div className={`rounded-lg border px-3 py-2 flex items-center gap-2.5 ${bg} ${border} ${className}`}>
        {late ? <PulseDot /> : <Icon size={14} className={`flex-shrink-0 ${color}`} />}
        <div className="min-w-0">
          <div className={`text-xs font-semibold whitespace-nowrap ${color}`}>{label}</div>
          <div className="text-[11px] text-gray-400">Due {dueDate}</div>
        </div>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${color} ${className}`}>
      {late ? <PulseDot /> : <Icon size={12} className="flex-shrink-0" />}
      {label}
    </span>
  )
}
import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'

interface Props {
  goLiveDate: string // 'YYYY-MM-DD'
  className?: string
}

function daysRemaining(dateStr: string) {
  const target = new Date(`${dateStr}T23:59:59`)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Live countdown ke tanggal go-live, dipakai di kartu "Aplikasi Perlu Perhatian".
 * Sama seperti DueDateTimer: refresh tiap menit, warna berubah otomatis, dan
 * berdenyut (animate-ping) saat go-live sudah lewat — supaya risikonya kelihatan
 * dari jauh, bukan cuma angka statis.
 */
export default function GoLiveCountdown({ goLiveDate, className = '' }: Props) {
  const [days, setDays] = useState(() => daysRemaining(goLiveDate))

  useEffect(() => {
    const tick = () => setDays(daysRemaining(goLiveDate))
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [goLiveDate])

  const late = days < 0
  const dueToday = days === 0
  const critical = !late && !dueToday && days <= 7

  let color: string
  let bg: string
  let border: string
  let label: string
  if (late) {
    color = 'text-red-600'; bg = 'bg-red-50'; border = 'border-red-200'
    label = `Lewat ${Math.abs(days)} hari`
  } else if (dueToday) {
    color = 'text-red-600'; bg = 'bg-red-50'; border = 'border-red-200'
    label = 'Go-live hari ini'
  } else if (critical) {
    color = 'text-amber-600'; bg = 'bg-amber-50'; border = 'border-amber-200'
    label = `H-${days} hari`
  } else {
    color = 'text-emerald-600'; bg = 'bg-emerald-50'; border = 'border-emerald-200'
    label = `H-${days} hari`
  }

  const urgent = late || dueToday

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${bg} ${border} ${className}`}>
      {urgent ? (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
        </span>
      ) : (
        <Rocket size={12} className={`flex-shrink-0 ${color}`} />
      )}
      <div className="leading-tight min-w-0">
        <div className={`text-xs font-bold font-mono whitespace-nowrap ${color}`}>{label}</div>
        <div className="text-[10px] text-gray-400 whitespace-nowrap">Go-live {goLiveDate}</div>
      </div>
    </div>
  )
}
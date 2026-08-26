interface Props {
  score: number
  className?: string
}

/**
 * Bar risiko horizontal — mirip pola SlaBar di aplikasi ITSM sebelah, tapi
 * dipakai untuk riskScore aplikasi. Warnanya mengikuti threshold yang sama
 * dengan yang sudah dipakai di Dashboard/ApplicationDetail (>=70 merah,
 * >=50 kuning, sisanya hijau) supaya konsisten di seluruh halaman.
 */
export default function RiskScoreBar({ score, className = '' }: Props) {
  const clamped = Math.max(0, Math.min(100, score))
  const color = score >= 70 ? '#dc2626' : score >= 50 ? '#d97706' : '#16A34A'
  const track = score >= 70 ? 'bg-red-50' : score >= 50 ? 'bg-amber-50' : 'bg-emerald-50'
  const text = score >= 70 ? 'text-red-600' : score >= 50 ? 'text-amber-600' : 'text-emerald-600'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 h-1.5 min-w-[56px] rounded-full ${track} overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <span className={`text-xs font-bold font-mono w-6 text-right ${text}`}>{score}</span>
    </div>
  )
}
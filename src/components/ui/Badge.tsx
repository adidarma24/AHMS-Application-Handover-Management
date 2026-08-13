interface BadgeProps {
  variant?: 'draft' | 'waiting' | 'inprogress' | 'approved' | 'rejected' | 'conditional' | 'accepted' | 'overdue' | 'critical' | 'high' | 'medium' | 'low' | 'open' | 'done' | 'default'
  children: React.ReactNode
  size?: 'sm' | 'md'
}

const variants: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  inprogress: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  conditional: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function Badge({ variant = 'default', children, size = 'sm' }: BadgeProps) {
  const cls = variants[variant] || variants.default
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${cls} ${sz} whitespace-nowrap`}>
      {children}
    </span>
  )
}

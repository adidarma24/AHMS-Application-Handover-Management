import type { ReactNode } from 'react'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

type AlertVariant = 'danger' | 'warning' | 'info' | 'success'

interface AlertProps {
  variant?: AlertVariant
  title: string
  children?: ReactNode
  className?: string
}

const styles: Record<AlertVariant, string> = {
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

const iconStyles: Record<AlertVariant, string> = {
  danger: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  success: 'text-emerald-500',
}

const icons: Record<AlertVariant, typeof AlertTriangle> = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

export default function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const Icon = icons[variant]
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${styles[variant]} ${className}`}>
      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${iconStyles[variant]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="text-xs mt-1.5 space-y-1">{children}</div>}
      </div>
    </div>
  )
}
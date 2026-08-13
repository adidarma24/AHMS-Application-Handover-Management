interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
  )
}

export function SkeletonKPICards() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-3">
          <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTableRows({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <Skeleton className={`h-4 ${ci === 0 ? 'w-36' : ci === cols - 1 ? 'w-20' : 'w-24'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function SkeletonChartCard({ height = 160 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="bg-gray-200 rounded-lg animate-pulse w-full" style={{ height }} />
    </div>
  )
}

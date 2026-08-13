import { useState, useMemo } from 'react'
import { AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { AppState, Role } from '../types'
import type { Page } from '../App'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
}

export default function ActionItems({ appState, currentUser, onNavigate }: Props) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const allItems = useMemo(() => {
    return appState.applications.flatMap(app =>
      app.actionItems.map(ai => ({ ...ai, appName: app.name, appId: app.id, pic: app.pic }))
    )
  }, [appState.applications])

  const filtered = useMemo(() => {
    let list = allItems
    if (filterStatus !== 'all') list = list.filter(ai => ai.status === filterStatus)
    if (filterPriority !== 'all') list = list.filter(ai => ai.priority === filterPriority)
    if (currentUser.role === 'Project Manager') list = list.filter(ai => ai.pic === currentUser.name || ai.assignee === currentUser.name)
    return list
  }, [allItems, filterStatus, filterPriority, currentUser])

  const overdueCount = filtered.filter(ai => ai.status === 'overdue').length
  const openCount = filtered.filter(ai => ai.status === 'open').length
  const doneCount = filtered.filter(ai => ai.status === 'completed').length

  // Sama seperti kpiCards di Dashboard.tsx: icon dalam kotak warna + angka besar + label + sub
  const summaryCards = [
    { label: 'Overdue', value: overdueCount, sub: 'Perlu segera ditangani', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Open', value: openCount, sub: 'Masih berjalan', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: doneCount, sub: 'Sudah selesai', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const priorityVariant = (p: string) => (p === 'high' ? 'high' : p === 'medium' ? 'medium' : 'low')
  const statusVariant = (s: string) => (s === 'overdue' ? 'overdue' : s === 'completed' ? 'done' : 'open')
  const statusLabel = (s: string) => (s === 'overdue' ? 'OVERDUE' : s === 'completed' ? 'DONE' : 'OPEN')

  return (
    <div className="space-y-6">
      {/* Header — sama persis dengan Dashboard.tsx */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Action Items</h1>
        <p className="text-sm text-gray-500 mt-0.5">Semua action item dari seluruh aplikasi</p>
      </div>

      {/* Summary cards — pola sama dengan KPI Cards di Dashboard */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map(s => (
          <Card key={s.label} className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={17} className={s.color} />
            </div>
            <div>
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Status</option>
          <option value="overdue">Overdue</option>
          <option value="open">Open</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Prioritas</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* List — struktur tabel sama dengan tabel "Aplikasi Perlu Perhatian" di Dashboard */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Action Item</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">Aplikasi</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">Assignee</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">Due Date</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">Prioritas</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((ai, i) => (
                <tr
                  key={i}
                  className={`border-b border-gray-50 hover:bg-gray-50 ${ai.status === 'overdue' ? 'bg-red-50/40' : ''}`}
                >
                  <td className="px-5 py-3">
                    <span className={`text-sm text-gray-900 ${ai.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                      {ai.title}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => onNavigate('app-detail', ai.appId)}
                      className="text-xs text-indigo-600 hover:underline text-left"
                    >
                      {ai.appName.length > 30 ? ai.appName.slice(0, 30) + '...' : ai.appName}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">{ai.assignee}</td>
                  <td className={`px-3 py-3 text-xs whitespace-nowrap ${ai.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {ai.dueDate}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={priorityVariant(ai.priority)}>{ai.priority.toUpperCase()}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={statusVariant(ai.status)}>{statusLabel(ai.status)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => onNavigate('app-detail', ai.appId)}
                      className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1 hover:bg-gray-50"
                    >
                      Detail <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-xs">
                    Tidak ada action item yang sesuai filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
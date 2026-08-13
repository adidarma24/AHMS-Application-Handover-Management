import { useState, useMemo } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import type { AppState, Role } from '../types'
import type { Page } from '../App'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
}

export default function MyApplications({ appState, currentUser, onNavigate }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCrit, setFilterCrit] = useState('all')
  const [sortBy, setSortBy] = useState('submittedDate')

  const apps = useMemo(() => {
    let list = appState.applications

    if (currentUser.role === 'Project Manager') {
      list = list.filter(a => a.pic === currentUser.name)
    } else if (currentUser.role === 'Business Owner') {
      list = list.filter(a => a.businessOwner === currentUser.name)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.pic.toLowerCase().includes(q) ||
        a.businessOwner.toLowerCase().includes(q) ||
        a.technology.toLowerCase().includes(q)
      )
    }
    if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus)
    if (filterCrit !== 'all') list = list.filter(a => a.criticality === filterCrit)

    return list.sort((a, b) => {
      if (sortBy === 'riskScore') return b.riskScore - a.riskScore
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
    })
  }, [appState.applications, currentUser, search, filterStatus, filterCrit, sortBy])

  // Helper pemetaan varian status badge
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Draft': return 'draft'
      case 'Waiting for O&M Review': return 'waiting'
      case 'Under Technical Review': return 'inprogress'
      case 'Rejected': return 'rejected'
      case 'Approved': return 'approved'
      case 'Handover Accepted': return 'accepted'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {currentUser.role === 'Project Manager' ? 'Aplikasi Saya' : 'Daftar Aplikasi'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{apps.length} aplikasi ditemukan</p>
        </div>
        {currentUser.role === 'Project Manager' && (
          <Button onClick={() => onNavigate('handover-form')}>
            + Ajukan Handover
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, PIC, teknologi..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Status</option>
          {['Draft', 'Waiting for O&M Review', 'Under Technical Review', 'Rejected', 'Approved', 'Handover Accepted'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={filterCrit}
          onChange={e => setFilterCrit(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Kritikalitas</option>
          {['Critical', 'High', 'Medium', 'Low'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="submittedDate">Terbaru</option>
          <option value="riskScore">Risiko Tertinggi</option>
          <option value="name">Nama A-Z</option>
        </select>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Aplikasi', 'Kritikalitas', 'PIC Project', 'PIC O&M', 'Status', 'Go-Live', 'Risiko', 'Action Items', ''].map(h => (
                  <th key={h} className="text-xs font-medium text-gray-500 px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map(app => (
                <tr
                  key={app.id}
                  onClick={() => onNavigate('app-detail', app.id)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 text-sm max-w-[220px] truncate">{app.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{app.category} • {app.environment}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={app.criticality.toLowerCase() as any}>
                      {app.criticality}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{app.pic}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{app.picOM}</td>
                  <td className="px-5 py-3">
                    <Badge variant={getStatusVariant(app.status) as any}>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {app.goLiveDate}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      app.riskScore >= 70 ? 'bg-red-50 text-red-600' :
                      app.riskScore >= 50 ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {app.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {app.actionItems.filter(a => a.status === 'overdue').length > 0 ? (
                      <span className="text-red-600 font-semibold">
                        {app.actionItems.filter(a => a.status === 'overdue').length} overdue
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {app.actionItems.length} total
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); onNavigate('app-detail', app.id) }}
                      className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-100 transition-colors"
                    >
                      Detail <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">
                    Tidak ada aplikasi yang sesuai filter
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
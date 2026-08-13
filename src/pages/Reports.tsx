import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  AppWindow,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  FileSpreadsheet,
  X,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import type { AppState, Role } from '../types'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
// Palet indigo, konsisten dengan Dashboard.tsx
const COLORS = ['#4f46e5', '#16A34A', '#D97706', '#DC2626', '#7c3aed', '#0891b2']

export default function Reports({ appState }: Props) {
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPIC, setFilterPIC] = useState('all')
  const [filterCrit, setFilterCrit] = useState('all')

  const apps = useMemo(() => {
    let list = appState.applications
    if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus)
    if (filterPIC !== 'all') list = list.filter(a => a.pic === filterPIC)
    if (filterCrit !== 'all') list = list.filter(a => a.criticality === filterCrit)
    if (filterMonth !== 'all') {
      const m = parseInt(filterMonth)
      list = list.filter(a => new Date(a.submittedDate).getMonth() + 1 === m)
    }
    return list
  }, [appState.applications, filterMonth, filterStatus, filterPIC, filterCrit])

  const statusDist = useMemo(() => {
    const map: Record<string, number> = {}
    apps.forEach(a => { map[a.status] = (map[a.status] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [apps])

  const critDist = useMemo(() => {
    const map: Record<string, number> = {}
    apps.forEach(a => { map[a.criticality] = (map[a.criticality] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [apps])

  const monthlyData = useMemo(() => {
    return MONTHS.map((label, idx) => {
      const m = idx + 1
      const total = apps.filter(a => new Date(a.submittedDate).getMonth() + 1 === m).length
      const accepted = apps.filter(a => a.status === 'Handover Accepted' && new Date(a.goLiveDate).getMonth() + 1 === m).length
      const rejected = apps.filter(a => a.status === 'Rejected' && new Date(a.submittedDate).getMonth() + 1 === m).length
      return { label, total, accepted, rejected }
    }).filter(d => d.total + d.accepted + d.rejected > 0)
  }, [apps])

  const picData = useMemo(() => {
    const map: Record<string, number> = {}
    apps.forEach(a => { map[a.pic] = (map[a.pic] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }))
  }, [apps])

  const uniquePICs = [...new Set(appState.applications.map(a => a.pic))]

  const avgRisk = apps.length > 0 ? Math.round(apps.reduce((sum, a) => sum + a.riskScore, 0) / apps.length) : 0
  const acceptedCount = apps.filter(a => a.status === 'Handover Accepted').length
  const rejectedCount = apps.filter(a => a.status === 'Rejected').length

  const hasActiveFilters = filterMonth !== 'all' || filterStatus !== 'all' || filterCrit !== 'all' || filterPIC !== 'all'
  const resetFilters = () => { setFilterMonth('all'); setFilterStatus('all'); setFilterCrit('all'); setFilterPIC('all') }

  function exportDummy() {
    alert('Export laporan sedang diproses... (Demo: fitur export ke Excel/PDF)')
  }

  // Sama seperti kpiCards di Dashboard.tsx: icon dalam kotak warna + angka besar + label + sub
  const kpiCards = [
    { label: 'Total Difilter', value: apps.length, sub: 'Aplikasi sesuai filter', icon: AppWindow, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Handover Accepted', value: acceptedCount, sub: 'Sudah selesai', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ditolak', value: rejectedCount, sub: 'Status rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    {
      label: 'Rata-rata Skor Risiko',
      value: avgRisk,
      sub: avgRisk >= 50 ? 'Perlu perhatian' : 'Dalam batas wajar',
      icon: TrendingUp,
      color: avgRisk >= 50 ? 'text-red-600' : 'text-amber-600',
      bg: avgRisk >= 50 ? 'bg-red-50' : 'bg-amber-50',
    },
  ]

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

  const critColor: Record<string, string> = {
    Critical: '#dc2626', High: '#d97706', Medium: '#4f46e5', Low: '#6b7280',
  }

  return (
    <div className="space-y-6">
      {/* Header — sama persis dengan Dashboard.tsx */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Menampilkan {apps.length} aplikasi sesuai filter</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportDummy}>
            <Download size={14} /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportDummy}>
            <FileSpreadsheet size={14} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filters — pola sama dengan Card filter di MyApplications.tsx */}
      <Card className="flex gap-3 flex-wrap items-center">
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Bulan</option>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m} {new Date().getFullYear()}</option>)}
        </select>
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
          value={filterPIC}
          onChange={e => setFilterPIC(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua PIC Project</option>
          {uniquePICs.map(p => <option key={p}>{p}</option>)}
        </select>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={12} /> Reset
          </button>
        )}
      </Card>

      {/* KPI Cards — pola sama dengan Dashboard.tsx */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map(k => (
          <Card key={k.label} className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center flex-shrink-0`}>
              <k.icon size={17} className={k.color} />
            </div>
            <div>
              <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-gray-400">{k.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Distribusi Status</h3>
            <p className="text-xs text-gray-400">Sebaran status aplikasi sesuai filter</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ value }) => `${value}`}>
                {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Distribusi Kritikalitas</h3>
            <p className="text-xs text-gray-400">Sebaran tingkat kritikalitas aplikasi</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={critDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                {critDist.map(entry => (
                  <Cell key={entry.name} fill={critColor[entry.name] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Pengajuan per Bulan</h3>
            <p className="text-xs text-gray-400">Diajukan vs accepted vs rejected</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f3f4f6' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" name="Diajukan" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="accepted" name="Accepted" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Top PIC Project by Volume</h3>
            <p className="text-xs text-gray-400">8 PIC Project teratas</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={picData} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="value" name="Aplikasi" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Table — struktur sama dengan Card padding=false + table di Dashboard/MyApplications.tsx */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Tabel Detail Aplikasi</h3>
          <p className="text-xs text-gray-400">Menampilkan {Math.min(apps.length, 15)} dari {apps.length} aplikasi</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Aplikasi', 'Status', 'Kritikalitas', 'PIC Project', 'Go-Live', 'Risk Score', 'Action Items'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-5 py-2.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.slice(0, 15).map(app => {
                const overdue = app.actionItems.filter(a => a.status === 'overdue').length
                return (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900 text-sm max-w-[220px] truncate">{app.name}</td>
                    <td className="px-5 py-3">
                      <Badge variant={getStatusVariant(app.status) as any}>{app.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={app.criticality.toLowerCase() as any}>{app.criticality}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{app.pic}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">{app.goLiveDate}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        app.riskScore >= 70 ? 'bg-red-50 text-red-600' :
                        app.riskScore >= 40 ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {app.riskScore}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {overdue > 0 ? (
                        <span className="text-red-600 font-semibold">{overdue} overdue</span>
                      ) : (
                        <span className="text-gray-400">{app.actionItems.length} total</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-xs">
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
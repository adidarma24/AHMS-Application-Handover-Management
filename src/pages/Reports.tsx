import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  BarChart,
  Bar,
  Cell as BarCell,
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
  FileText,
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

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

export default function Reports({ appState }: Props) {
  const [filterYear, setFilterYear] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPIC, setFilterPIC] = useState('all')
  const [filterCrit, setFilterCrit] = useState('all')

  const years = useMemo(() => {
    const set = new Set(appState.applications.map(a => new Date(a.submittedDate).getFullYear()))
    set.add(new Date().getFullYear())
    return [...set].sort((a, b) => b - a)
  }, [appState.applications])

  // appsBase = semua filter KECUALI bulan. Dipakai untuk chart tren bulanan,
  // supaya chart itu tetap menampilkan pola 12 bulan walau user sedang
  // memfilter ke satu bulan spesifik di filter utama (sebelumnya chart ini
  // ikut kepotong jadi cuma 1 bar saat filter bulan aktif — tidak berguna).
  const appsBase = useMemo(() => {
    let list = appState.applications
    if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus)
    if (filterPIC !== 'all') list = list.filter(a => a.pic === filterPIC)
    if (filterCrit !== 'all') list = list.filter(a => a.criticality === filterCrit)
    if (filterYear !== 'all') {
      const y = parseInt(filterYear)
      list = list.filter(a => new Date(a.submittedDate).getFullYear() === y)
    }
    return list
  }, [appState.applications, filterStatus, filterPIC, filterCrit, filterYear])

  const apps = useMemo(() => {
    let list = appsBase
    if (filterMonth !== 'all') {
      const m = parseInt(filterMonth)
      list = list.filter(a => new Date(a.submittedDate).getMonth() + 1 === m)
    }
    return list
  }, [appsBase, filterMonth])

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

  // Semua tiga metrik (total/accepted/rejected) sekarang konsisten dihitung
  // dari submittedDate yang sama, per kohort bulan pengajuan — sebelumnya
  // 'accepted' memakai goLiveDate sehingga 3 bar dalam satu grup bulan
  // sebenarnya membandingkan tanggal yang berbeda-beda.
  const monthlyData = useMemo(() => {
    return MONTHS.map((label, idx) => {
      const m = idx + 1
      const inMonth = appsBase.filter(a => new Date(a.submittedDate).getMonth() + 1 === m)
      return {
        label,
        month: m,
        total: inMonth.length,
        accepted: inMonth.filter(a => a.status === 'Handover Accepted').length,
        rejected: inMonth.filter(a => a.status === 'Rejected').length,
      }
    }).filter(d => d.total > 0)
  }, [appsBase])

  const selectedMonth = filterMonth !== 'all' ? parseInt(filterMonth) : null

  const picData = useMemo(() => {
    const map: Record<string, number> = {}
    apps.forEach(a => { map[a.pic] = (map[a.pic] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }))
  }, [apps])

  const uniquePICs = [...new Set(appState.applications.map(a => a.pic))]

  const avgRisk = apps.length > 0 ? Math.round(apps.reduce((sum, a) => sum + a.riskScore, 0) / apps.length) : 0
  const acceptedCount = apps.filter(a => a.status === 'Handover Accepted').length
  const rejectedCount = apps.filter(a => a.status === 'Rejected').length

  const hasActiveFilters = filterYear !== 'all' || filterMonth !== 'all' || filterStatus !== 'all' || filterCrit !== 'all' || filterPIC !== 'all'
  const resetFilters = () => { setFilterYear('all'); setFilterMonth('all'); setFilterStatus('all'); setFilterCrit('all'); setFilterPIC('all') }

  // Export Excel — beneran jalan (client-side, pakai SheetJS), bukan dummy alert.
  function exportExcel() {
    const rows = apps.map(a => ({
      'Nama Aplikasi': a.name,
      'Status': a.status,
      'Kritikalitas': a.criticality,
      'PIC Project': a.pic,
      'PIC O&M': a.picOM,
      'Business Owner': a.businessOwner,
      'Tanggal Submit': a.submittedDate,
      'Target Go-Live': a.goLiveDate,
      'Skor Risiko': a.riskScore,
      'Action Item Overdue': a.actionItems.filter(ai => ai.status === 'overdue').length,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 32 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan AHMS')
    XLSX.writeFile(wb, `Laporan-AHMS-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Export PDF — pakai dialog print bawaan browser ("Save as PDF"), tanpa
  // library tambahan. Elemen ber-class `print:hidden` (filter, tombol,
  // sidebar/topbar di Layout.tsx) otomatis disembunyikan saat print lewat
  // CSS @media print dari Tailwind.
  function exportPDF() {
    window.print()
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
      {/* Header — ditumpuk vertikal di mobile, tombol export jadi 2 kolom
          penuh supaya tidak berdesakan dengan judul di layar sempit.
          print:hidden supaya tidak ikut ke hasil "Export PDF". */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Menampilkan {apps.length} aplikasi sesuai filter</p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 print:hidden">
          <Button variant="outline" size="sm" className="justify-center" onClick={exportExcel}>
            <Download size={14} /> Excel
          </Button>
          <Button variant="outline" size="sm" className="justify-center" onClick={exportPDF}>
            <FileText size={14} /> PDF
          </Button>
        </div>
      </div>

      {/* Filters — grid 2 kolom di mobile supaya rapi, flex-wrap di layar lebih lebar */}
      <Card className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-center print:hidden">
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Tahun</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Bulan</option>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
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
          className="col-span-2 sm:col-auto px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua PIC Project</option>
          {uniquePICs.map(p => <option key={p}>{p}</option>)}
        </select>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="col-span-2 sm:col-auto inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
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

      {/* Charts row 1 — breakpoint diturunkan ke lg (dari xl) supaya tablet
          juga dapat 2 kolom, tetap 1 kolom penuh di HP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Distribusi Status</h3>
            <p className="text-xs text-gray-400">Sebaran status aplikasi sesuai filter</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius={70} label={({ value }) => `${value}`}>
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
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              {/* Label disederhanakan jadi angka saja (nama dipindah ke Legend) —
                  sebelumnya label "Nama: Angka" langsung di sekitar pie gampang
                  kepotong/tumpang tindih di layar sempit. */}
              <Pie data={critDist} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius={70} label={({ value }) => `${value}`}>
                {critDist.map(entry => (
                  <Cell key={entry.name} fill={critColor[entry.name] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 2 — breakpoint diturunkan ke lg (dari xl) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Pengajuan per Bulan</h3>
            <p className="text-xs text-gray-400">
              Diajukan vs accepted vs rejected — per kohort bulan submit
              {selectedMonth && <span className="text-indigo-600 font-medium"> (bulan {MONTHS[selectedMonth - 1]} disorot sesuai filter)</span>}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f3f4f6' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" name="Diajukan" fill="#a5b4fc" radius={[4, 4, 0, 0]}>
                {monthlyData.map((d, i) => (
                  <BarCell key={i} fillOpacity={selectedMonth && d.month !== selectedMonth ? 0.35 : 1} />
                ))}
              </Bar>
              <Bar dataKey="accepted" name="Accepted" fill="#16A34A" radius={[4, 4, 0, 0]}>
                {monthlyData.map((d, i) => (
                  <BarCell key={i} fillOpacity={selectedMonth && d.month !== selectedMonth ? 0.35 : 1} />
                ))}
              </Bar>
              <Bar dataKey="rejected" name="Rejected" fill="#dc2626" radius={[4, 4, 0, 0]}>
                {monthlyData.map((d, i) => (
                  <BarCell key={i} fillOpacity={selectedMonth && d.month !== selectedMonth ? 0.35 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Top PIC Project by Volume</h3>
            <p className="text-xs text-gray-400">8 PIC Project teratas</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={picData} layout="vertical" margin={{ top: 0, right: 10, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={72}
                tickFormatter={(name: string) => truncate(name, 11)}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="value" name="Aplikasi" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Table — di mobile diganti tampilan kartu (di bawah), tabel aslinya
          disembunyikan (bukan cuma overflow-x-auto) supaya tidak perlu geser
          horizontal untuk baca 7 kolom di layar kecil. */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Tabel Detail Aplikasi</h3>
          <p className="text-xs text-gray-400">Menampilkan {Math.min(apps.length, 15)} dari {apps.length} aplikasi</p>
        </div>

        {/* Desktop/tablet: tabel penuh */}
        <div className="hidden md:block overflow-x-auto">
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

        {/* Mobile: kartu ringkas, bukan tabel yang harus digeser horizontal */}
        <div className="md:hidden divide-y divide-gray-50">
          {apps.slice(0, 15).map(app => {
            const overdue = app.actionItems.filter(a => a.status === 'overdue').length
            return (
              <div key={app.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900 min-w-0 truncate">{app.name}</p>
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    app.riskScore >= 70 ? 'bg-red-50 text-red-600' :
                    app.riskScore >= 40 ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {app.riskScore}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <Badge variant={getStatusVariant(app.status) as any}>{app.status}</Badge>
                  <Badge variant={app.criticality.toLowerCase() as any}>{app.criticality}</Badge>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span className="truncate">{app.pic}</span>
                  <span className="flex-shrink-0">Go-live {app.goLiveDate}</span>
                </div>
                {overdue > 0 && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5">{overdue} action item overdue</p>
                )}
              </div>
            )
          })}
          {apps.length === 0 && (
            <p className="px-4 py-10 text-center text-gray-400 text-xs">Tidak ada aplikasi yang sesuai filter</p>
          )}
        </div>
      </Card>
    </div>
  )
}
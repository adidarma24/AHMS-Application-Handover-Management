import { useMemo, useState } from 'react'
import { FileText, AlertTriangle, FolderOpen, File, Download, Search, X, User } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import type { AppState, Role } from '../types'
import type { Page } from '../App'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
}

export default function Documents({ appState, currentUser, onNavigate }: Props) {
  const [search, setSearch] = useState('')
  const [filterAppId, setFilterAppId] = useState('all')
  const [onlyIncomplete, setOnlyIncomplete] = useState(false)

  // Sebelumnya `currentUser` diterima tapi tidak pernah dipakai — halaman
  // menampilkan dokumen dari SEMUA aplikasi ke SEMUA role, termasuk Project
  // Manager yang harusnya cuma relevan dengan aplikasinya sendiri (tidak
  // konsisten dengan MyApplications.tsx/ActionItems.tsx yang scoping by
  // role). Sekarang disamakan: PM & Business Owner lihat aplikasi mereka
  // saja; role lain (Reviewer/O&M/Manager/Admin) tetap lihat semua untuk
  // keperluan audit/compliance.
  const scopedApps = useMemo(() => {
    if (currentUser.role === 'Project Manager') {
      return appState.applications.filter(a => a.pic === currentUser.name)
    }
    if (currentUser.role === 'Business Owner') {
      return appState.applications.filter(a => a.businessOwner === currentUser.name)
    }
    return appState.applications
  }, [appState.applications, currentUser])

  const missingAll = useMemo(
    () => scopedApps.flatMap(app =>
      app.documents.filter(d => !d.uploaded && d.required).map(d => ({ ...d, appName: app.name, appId: app.id }))
    ),
    [scopedApps]
  )

  // Dikelompokkan per APLIKASI (bukan per tipe dokumen seperti sebelumnya)
  // — supaya pertanyaan paling natural "aplikasi X sudah lengkap dokumennya
  // belum?" bisa langsung terjawab tanpa loncat ke ApplicationDetail.
  // Aplikasi yang masih ada dokumen wajib hilang ditaruh di atas.
  const appGroups = useMemo(() => {
    let list = scopedApps.filter(app => app.documents.length > 0)

    if (filterAppId !== 'all') list = list.filter(app => app.id === filterAppId)
    if (onlyIncomplete) list = list.filter(app => app.documents.some(d => !d.uploaded && d.required))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(app =>
        app.name.toLowerCase().includes(q) ||
        app.documents.some(d => d.name.toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => {
      const missingA = a.documents.filter(d => !d.uploaded && d.required).length
      const missingB = b.documents.filter(d => !d.uploaded && d.required).length
      return missingB - missingA
    })
  }, [scopedApps, filterAppId, onlyIncomplete, search])

  const totalUploaded = scopedApps.reduce((sum, a) => sum + a.documents.filter(d => d.uploaded).length, 0)
  const totalTypes = new Set(scopedApps.flatMap(a => a.documents.filter(d => d.uploaded).map(d => d.type))).size

  const summaryCards = [
    { label: 'Total Dokumen', value: totalUploaded, sub: 'Sudah terupload', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Dokumen Wajib Hilang', value: missingAll.length, sub: 'Belum diupload', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Tipe Dokumen', value: totalTypes, sub: 'Kategori berbeda', icon: FolderOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const hasActiveFilters = search !== '' || filterAppId !== 'all' || onlyIncomplete
  const resetFilters = () => { setSearch(''); setFilterAppId('all'); setOnlyIncomplete(false) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dokumen</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {currentUser.role === 'Project Manager' || currentUser.role === 'Business Owner'
            ? 'Repositori dokumen handover aplikasi Anda'
            : 'Repositori dokumen handover seluruh aplikasi'}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map(s => (
          <Card key={s.label} className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
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

      {missingAll.length > 0 && (
        <Alert variant="danger" title={`${missingAll.length} dokumen wajib belum diupload`}>
          {missingAll.slice(0, 5).map((d, i) => (
            <button
              key={i}
              onClick={() => onNavigate('app-detail', d.appId)}
              className="flex items-center gap-2 text-left hover:underline"
            >
              <span>•</span>
              <span>{d.appName} — {d.name}</span>
            </button>
          ))}
          {missingAll.length > 5 && (
            <p className="pt-1 text-red-500">+ {missingAll.length - 5} dokumen wajib lainnya — pakai filter "Belum lengkap" di bawah untuk lihat semua</p>
          )}
        </Alert>
      )}

      {/* Filters — grid 2 kolom di mobile, sejajar mulai sm */}
      <Card className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-center">
        <div className="relative col-span-2 sm:flex-1 sm:min-w-50">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama aplikasi atau dokumen..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-colors"
          />
        </div>
        <select
          value={filterAppId}
          onChange={e => setFilterAppId(e.target.value)}
          className="col-span-2 sm:col-auto px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        >
          <option value="all">Semua Aplikasi</option>
          {scopedApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={onlyIncomplete} onChange={e => setOnlyIncomplete(e.target.checked)} />
          Belum lengkap saja
        </label>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={12} /> Reset
          </button>
        )}
      </Card>

      {/* Dikelompokkan per aplikasi — tiap kartu punya badge progres
          "x/y wajib" supaya kelengkapan langsung kelihatan sekilas. */}
      {appGroups.length === 0 ? (
        <Card className="text-center py-10 text-gray-400 text-sm">
          Tidak ada aplikasi dengan dokumen yang sesuai filter
        </Card>
      ) : (
        appGroups.map(app => {
          const requiredDocs = app.documents.filter(d => d.required)
          const requiredUploaded = requiredDocs.filter(d => d.uploaded).length
          const complete = requiredDocs.length > 0 && requiredUploaded === requiredDocs.length

          return (
            <Card key={app.id} padding={false}>
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 flex-wrap">
                <FolderOpen size={16} className="text-gray-400 shrink-0" />
                <button
                  onClick={() => onNavigate('app-detail', app.id)}
                  className="text-sm font-semibold text-gray-900 hover:text-indigo-600 hover:underline text-left min-w-0 truncate"
                >
                  {app.name}
                </button>
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                  <User size={11} /> {app.pic}
                </span>
                {requiredDocs.length > 0 && (
                  <Badge variant={complete ? 'accepted' : 'rejected'} size="sm">
                    {requiredUploaded}/{requiredDocs.length} wajib
                  </Badge>
                )}
                <span className="ml-auto text-xs text-gray-400 shrink-0">{app.documents.length} dokumen</span>
              </div>
              <div>
                {app.documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-b-0 ${!doc.uploaded ? 'bg-red-50/40' : ''}`}
                  >
                    <File size={18} className={`shrink-0 ${doc.uploaded ? 'text-gray-400' : 'text-red-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${doc.uploaded ? 'text-gray-900' : 'text-red-600'}`}>{doc.name}</div>
                      <div className="text-xs text-gray-400">
                        {doc.type}
                        {doc.uploadedAt && ` • diupload ${doc.uploadedAt}`}
                        {!doc.uploaded && ' • belum diupload'}
                      </div>
                    </div>
                    {doc.required && <Badge variant="rejected">WAJIB</Badge>}
                    {doc.uploaded ? (
                      <button
                        onClick={() => alert(`Unduh ${doc.name} — demo, belum ada penyimpanan file sungguhan`)}
                        title="Demo: belum ada penyimpanan file sungguhan di backend"
                        className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 shrink-0"
                      >
                        <Download size={12} /> Unduh
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('app-detail', app.id)}
                        className="text-xs text-indigo-600 hover:underline shrink-0"
                      >
                        Upload →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
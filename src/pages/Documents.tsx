import { useMemo } from 'react'
import { FileText, AlertTriangle, FolderOpen, File, Download } from 'lucide-react'
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
  const allDocs = useMemo(() => {
    return appState.applications.flatMap(app =>
      app.documents.map(doc => ({ ...doc, appName: app.name, appId: app.id, appPic: app.pic }))
    )
  }, [appState.applications])

  const uploaded = allDocs.filter(d => d.uploaded)
  const missing = allDocs.filter(d => !d.uploaded && d.required)

  const typeGroups = useMemo(() => {
    const map: Record<string, typeof allDocs> = {}
    uploaded.forEach(d => { (map[d.type] = map[d.type] || []).push(d) })
    return map
  }, [uploaded])

  // Sama seperti kpiCards di Dashboard.tsx: icon dalam kotak warna + angka besar + label + sub
  const summaryCards = [
    { label: 'Total Dokumen', value: uploaded.length, sub: 'Sudah terupload', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Dokumen Wajib Hilang', value: missing.length, sub: 'Belum diupload', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Tipe Dokumen', value: Object.keys(typeGroups).length, sub: 'Kategori berbeda', icon: FolderOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header — sama persis dengan Dashboard.tsx */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dokumen</h1>
        <p className="text-sm text-gray-500 mt-0.5">Repositori dokumen handover seluruh aplikasi</p>
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

      {/* Missing docs alert — pakai komponen Alert baru (belum ada sebelumnya, jadi ditambahkan) */}
      {missing.length > 0 && (
        <Alert variant="danger" title={`${missing.length} dokumen wajib belum diupload`}>
          {missing.slice(0, 5).map((d, i) => (
            <button
              key={i}
              onClick={() => onNavigate('app-detail', d.appId)}
              className="flex items-center gap-2 text-left hover:underline"
            >
              <span>•</span>
              <span>{d.appName} — {d.name}</span>
            </button>
          ))}
        </Alert>
      )}

      {/* By type — Card padding=false dengan header + list, konsisten dengan tabel Card lain */}
      {Object.entries(typeGroups).map(([type, docs]) => (
        <Card key={type} padding={false}>
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100">
            <FolderOpen size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">{type}</span>
            <Badge variant="default">{docs.length}</Badge>
          </div>
          <div>
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-b-0">
                <File size={18} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{doc.name}</div>
                  <div className="text-xs text-gray-400">
                    <button
                      onClick={() => onNavigate('app-detail', doc.appId)}
                      className="text-indigo-600 hover:underline"
                    >
                      {doc.appName}
                    </button>
                    {doc.uploadedAt && ` • ${doc.uploadedAt}`}
                  </div>
                </div>
                {doc.required && <Badge variant="rejected">WAJIB</Badge>}
                <button
                  onClick={() => alert(`Download ${doc.name} (Demo)`)}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 flex-shrink-0"
                >
                  <Download size={12} /> Unduh
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
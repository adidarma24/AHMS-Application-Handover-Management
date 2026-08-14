import { useState } from 'react'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, FileText, Bot,
  ChevronDown, ChevronUp, Mail, Plus,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import type { AppState, Application, AppStatus, Criticality, Role } from '../types'
import type { Page } from '../App'

interface Props {
  app: Application
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
  onUpdateApp: (id: string, updates: Partial<Application>) => void
}

type Tab = 'overview' | 'documents' | 'action-items' | 'history' | 'berita-acara'

// Konsisten dengan skema warna Badge.tsx (dipakai juga di Reports.tsx)
const statusVariant: Record<AppStatus, any> = {
  'Draft': 'draft',
  'Waiting for O&M Review': 'waiting',
  'Under Technical Review': 'inprogress',
  'Rejected': 'rejected',
  'Approved': 'approved',
  'Handover Accepted': 'accepted',
}

const critVariant: Record<Criticality, any> = {
  Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low',
}

const priorityVariant = (p: string) => (p === 'high' ? 'high' : p === 'medium' ? 'medium' : 'low')
const aiStatusVariant = (s: string) => (s === 'overdue' ? 'overdue' : s === 'completed' ? 'done' : 'open')
const aiStatusLabel = (s: string) => (s === 'overdue' ? 'OVERDUE' : s === 'completed' ? 'DONE' : 'OPEN')

export default function ApplicationDetail({ app, appState, currentUser, onNavigate, onUpdateApp }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [showEscModal, setShowEscModal] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(true)
  const [newActionTitle, setNewActionTitle] = useState('')
  const [newActionRequired, setNewActionRequired] = useState(false)
  const [copied, setCopied] = useState(false)

  const overdueCount = app.actionItems.filter(a => a.status === 'overdue').length
  const daysSinceSubmit = Math.floor((Date.now() - new Date(app.submittedDate).getTime()) / (1000 * 60 * 60 * 24))
  const rejectedReviewers = app.reviewers.filter(r => r.status === 'rejected')

  const riskLevel = app.riskScore >= 70 ? 'Tinggi' : app.riskScore >= 40 ? 'Sedang' : 'Rendah'
  const riskColor = app.riskScore >= 70 ? '#dc2626' : app.riskScore >= 40 ? '#d97706' : '#16A34A'
  const riskBg = app.riskScore >= 70 ? 'bg-red-50' : app.riskScore >= 40 ? 'bg-amber-50' : 'bg-emerald-50'

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Dokumen (${app.documents.length})` },
    { id: 'action-items', label: `Action Items (${app.actionItems.length})` },
    { id: 'history', label: 'Riwayat / Audit Trail' },
    ...(app.beritaAcaraNumber ? [{ id: 'berita-acara' as Tab, label: 'Berita Acara' }] : []),
  ]

  function nowTimestamp() {
    return `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`
  }

  // Menambah action item sekarang juga mencatat ke history, supaya konsisten
  // dengan tab "Riwayat / Audit Trail" dan notifikasi di Layout.tsx (yang
  // sumbernya langsung dari app.history).
  function addActionItem() {
    if (!newActionTitle.trim()) return
    const title = newActionTitle.trim()
    const newItem = {
      id: `ai-${Date.now()}`,
      title,
      assignee: app.pic,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'open' as const,
      priority: 'medium' as const,
      required: newActionRequired,
    }
    const historyEntry = {
      id: `h-${Date.now()}`,
      timestamp: nowTimestamp(),
      user: currentUser.name,
      action: `Action item ditambahkan${newActionRequired ? ' (WAJIB)' : ''}: "${title}"`,
    }
    onUpdateApp(app.id, { actionItems: [...app.actionItems, newItem], history: [...app.history, historyEntry] })
    setNewActionTitle('')
    setNewActionRequired(false)
  }

  function toggleActionStatus(ai: Application['actionItems'][number]) {
    const completing = ai.status !== 'completed'
    const updatedItems = app.actionItems.map(x =>
      x.id === ai.id ? { ...x, status: completing ? 'completed' as const : 'open' as const } : x
    )
    const historyEntry = {
      id: `h-${Date.now()}`,
      timestamp: nowTimestamp(),
      user: currentUser.name,
      action: completing ? `Action item diselesaikan: "${ai.title}"` : `Action item dibuka kembali: "${ai.title}"`,
    }
    onUpdateApp(app.id, { actionItems: updatedItems, history: [...app.history, historyEntry] })
  }

  const aiInsightReasons: string[] = []
  if (overdueCount > 0) aiInsightReasons.push(`${overdueCount} action item overdue`)
  if (rejectedReviewers.length > 0) aiInsightReasons.push(`ditolak oleh ${rejectedReviewers.map(r => r.role).join(', ')}`)
  if (daysSinceSubmit > 60) aiInsightReasons.push(`sudah ${daysSinceSubmit} hari sejak pengajuan`)
  if (app.criticality === 'Critical') aiInsightReasons.push(`kritikalitas Critical`)
  if (!app.documents.every(d => d.uploaded)) aiInsightReasons.push(`dokumen wajib belum lengkap`)

  const escalationDraft = `Kepada: Manager Divisi IT & O&M
Cc: ${app.businessOwner}, ${app.pic}, ${app.picOM}
Subjek: [ESKALASI] Hambatan Proses Handover — ${app.name}

Yth. Bapak/Ibu Manager,

Dengan hormat, kami sampaikan bahwa proses handover aplikasi berikut memerlukan perhatian segera:

Aplikasi  : ${app.name}
PIC Project : ${app.pic}
PIC O&M   : ${app.picOM}
Status    : ${app.status}
Diajukan  : ${app.submittedDate} (${daysSinceSubmit} hari lalu)
Kritikalitas: ${app.criticality}

KONDISI SAAT INI:
${aiInsightReasons.map(r => `• ${r.charAt(0).toUpperCase() + r.slice(1)}`).join('\n') || '• Proses review berjalan lambat'}

Kami memohon intervensi dan keputusan dalam waktu 3 hari kerja untuk memastikan jadwal go-live ${app.goLiveDate} dapat terpenuhi.

Hormat kami,
${currentUser.name}
${currentUser.role}
PT PERTAMINA`

  // Membuka jendela cetak berisi Berita Acara yang sudah diformat, supaya bisa
  // langsung di-print atau disimpan sebagai PDF lewat dialog print browser.
  function printBeritaAcara() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const reviewersRows = app.reviewers
      .map(
        r => `
        <tr>
          <td>${r.role}</td>
          <td>${r.name}</td>
          <td>${r.status === 'approved' ? 'Disetujui' : r.status === 'approved_with_condition' ? 'Disetujui dgn Kondisi' : r.status}</td>
          <td>${r.reviewedAt || '-'}</td>
        </tr>`
      )
      .join('')
    const managerOM = appState.users.find(u => u.role === 'Manager O&M')?.name || '-'
    printWindow.document.write(`
      <html>
        <head>
          <title>Berita Acara Handover - ${app.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1a2332; }
            h1 { text-align: center; font-size: 16px; margin-bottom: 4px; }
            .num { text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0; }
            td, th { padding: 6px 8px; }
            .info td:first-child { width: 160px; color: #6b7280; vertical-align: top; }
            .approvals th, .approvals td { border: 1px solid #e5e7eb; }
            .approvals th { background: #f9fafb; text-align: left; }
            .sign { display: flex; justify-content: space-between; margin-top: 60px; text-align: center; }
            .sign div { width: 30%; }
            .sign .line { border-top: 1px solid #333; margin-top: 50px; padding-top: 6px; font-weight: 600; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>BERITA ACARA SERAH TERIMA (HANDOVER) APLIKASI</h1>
          <div class="num">Nomor: ${app.beritaAcaraNumber}</div>
          <p>Pada hari ini, <strong>${app.beritaAcaraGeneratedAt}</strong>, telah dilaksanakan serah terima tanggung jawab operasional aplikasi berikut dari Project Team kepada O&amp;M Application Support, dengan rincian sebagai berikut:</p>
          <table class="info">
            <tbody>
              <tr><td>Nama Aplikasi</td><td>: ${app.name}</td></tr>
              <tr><td>Kategori</td><td>: ${app.category}</td></tr>
              <tr><td>Kritikalitas</td><td>: ${app.criticality}</td></tr>
              <tr><td>PIC Project</td><td>: ${app.pic}</td></tr>
              <tr><td>PIC O&amp;M</td><td>: ${app.picOM}</td></tr>
              <tr><td>Business Owner</td><td>: ${app.businessOwner}</td></tr>
              <tr><td>Tanggal Go-Live</td><td>: ${app.goLiveDate}</td></tr>
            </tbody>
          </table>
          <p>Aplikasi tersebut telah melalui proses review dan dinyatakan <strong>LAYAK</strong> untuk diserahterimakan, dengan persetujuan sebagai berikut:</p>
          <table class="approvals">
            <thead><tr><th>Peran</th><th>Nama</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>${reviewersRows}</tbody>
          </table>
          <p>Seluruh action item wajib terkait proses handover ini telah diselesaikan per tanggal berita acara ini diterbitkan. Dokumen ini dihasilkan otomatis oleh sistem AHMS dan sah tanpa memerlukan tanda tangan basah.</p>
          <div class="sign">
            <div><div class="line">${app.pic}</div><div>Project Manager</div></div>
            <div><div class="line">${app.picOM}</div><div>O&amp;M Application Support</div></div>
            <div><div class="line">${managerOM}</div><div>Manager O&amp;M</div></div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => onNavigate('my-applications')}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft size={14} /> Kembali ke daftar aplikasi
      </button>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{app.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{app.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={statusVariant[app.status]} size="md">{app.status}</Badge>
            <Badge variant={critVariant[app.criticality]} size="md">{app.criticality}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['PIC Project', app.pic],
            ['PIC O&M', app.picOM],
            ['Business Owner', app.businessOwner],
            ['Target Go-Live', app.goLiveDate],
            ['Diajukan', app.submittedDate],
            ['Teknologi', app.technology],
            ['Environment', app.environment],
            ['Vendor', app.vendor],
            ['Kategori', app.category],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
              <div className="text-xs font-medium text-gray-900 mt-0.5 truncate">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Main content */}
        <Card padding={false}>
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Overview */}
            {tab === 'overview' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3.5">Status Reviewer</h3>
                {app.reviewers.length === 0 ? (
                  <p className="text-sm text-gray-400">Belum ada reviewer (status Draft)</p>
                ) : app.reviewers.map(r => {
                  const isApproved = r.status === 'approved' || r.status === 'approved_with_condition'
                  const isRejected = r.status === 'rejected'
                  const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock
                  const iconColor = isApproved ? 'text-emerald-500' : isRejected ? 'text-red-500' : 'text-amber-500'
                  const statusColor = isApproved ? 'text-emerald-600' : isRejected ? 'text-red-600' : 'text-amber-600'
                  return (
                    <div key={r.role} className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 rounded-lg mb-2">
                      <Icon size={18} className={`flex-shrink-0 ${iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.role}</div>
                        {r.notes && <div className="text-xs text-amber-600 italic mt-0.5">{r.notes}</div>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-semibold ${statusColor}`}>
                          {r.status === 'approved' ? 'Approved' : r.status === 'approved_with_condition' ? 'Approved w/ Condition' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                        {r.reviewedAt && <div className="text-[10px] text-gray-400">{r.reviewedAt}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Documents */}
            {tab === 'documents' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3.5">Dokumen Handover</h3>
                {app.documents.length === 0 ? (
                  <p className="text-sm text-gray-400">Belum ada dokumen</p>
                ) : app.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-3.5 py-3 border border-gray-100 rounded-lg mb-2">
                    <FileText size={20} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                      <div className="text-xs text-gray-400">{doc.type} {doc.uploadedAt && `• Uploaded ${doc.uploadedAt}`}</div>
                    </div>
                    {doc.required && <Badge variant="rejected">WAJIB</Badge>}
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${doc.uploaded ? 'text-emerald-600' : 'text-red-600'}`}>
                      {doc.uploaded ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {doc.uploaded ? 'Ada' : 'Belum'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Items */}
            {tab === 'action-items' && (
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    value={newActionTitle}
                    onChange={e => setNewActionTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addActionItem()}
                    placeholder="Tambah action item baru..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                  />
                  <Button size="sm" onClick={addActionItem}>
                    <Plus size={14} /> Tambah
                  </Button>
                </div>
                <label className="flex items-center gap-2 mb-4 text-xs text-gray-600 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={newActionRequired}
                    onChange={e => setNewActionRequired(e.target.checked)}
                  />
                  Wajib diselesaikan sebelum final approval
                </label>
                {app.actionItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Belum ada action item</p>
                ) : app.actionItems.map(ai => (
                  <div
                    key={ai.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg mb-2 border ${
                      ai.status === 'overdue' ? 'border-red-200 bg-red-50' : ai.status === 'completed' ? 'border-gray-100 bg-emerald-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <input type="checkbox" checked={ai.status === 'completed'} onChange={() => toggleActionStatus(ai)} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm text-gray-900 ${ai.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{ai.title}</div>
                      <div className="text-xs text-gray-500">{ai.assignee} • Due: {ai.dueDate}</div>
                    </div>
                    {ai.required && <Badge variant="rejected">WAJIB</Badge>}
                    <Badge variant={aiStatusVariant(ai.status)}>{aiStatusLabel(ai.status)}</Badge>
                    <Badge variant={priorityVariant(ai.priority)}>{ai.priority.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* History */}
            {tab === 'history' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3.5">Audit Trail</h3>
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-gray-100" />
                  {[...app.history].reverse().map(h => (
                    <div key={h.id} className="relative mb-4">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="text-xs text-gray-400 mb-0.5">{h.timestamp}</div>
                      <div className="text-sm font-medium text-gray-900">{h.action}</div>
                      <div className="text-xs text-gray-500">oleh {h.user}</div>
                      {h.notes && <div className="text-xs text-amber-600 italic mt-0.5">"{h.notes}"</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Berita Acara Handover — digenerate otomatis oleh sistem saat Final Approval
                diberikan (Kebutuhan Fungsional #13). Hanya muncul jika app.beritaAcaraNumber ada. */}
            {tab === 'berita-acara' && app.beritaAcaraNumber && (
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm font-semibold text-gray-900">Berita Acara Serah Terima Handover</h3>
                  <Button size="sm" variant="outline" onClick={printBeritaAcara}>
                    Cetak / Unduh
                  </Button>
                </div>
                <div className="border border-gray-200 rounded-xl p-6 bg-white text-sm text-gray-800 leading-relaxed">
                  <div className="text-center mb-5">
                    <div className="font-bold text-base">BERITA ACARA SERAH TERIMA (HANDOVER) APLIKASI</div>
                    <div className="text-xs text-gray-500 mt-1">Nomor: {app.beritaAcaraNumber}</div>
                  </div>
                  <p>
                    Pada hari ini, <strong>{app.beritaAcaraGeneratedAt}</strong>, telah dilaksanakan serah terima
                    tanggung jawab operasional aplikasi berikut dari Project Team kepada O&M Application Support,
                    dengan rincian sebagai berikut:
                  </p>
                  <table className="w-full text-xs my-4">
                    <tbody>
                      {[
                        ['Nama Aplikasi', app.name],
                        ['Kategori', app.category],
                        ['Kritikalitas', app.criticality],
                        ['PIC Project', app.pic],
                        ['PIC O&M', app.picOM],
                        ['Business Owner', app.businessOwner],
                        ['Tanggal Go-Live', app.goLiveDate],
                      ].map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-1 pr-3 text-gray-500 w-40 align-top">{k}</td>
                          <td className="py-1 font-medium text-gray-900">: {v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mb-2">
                    Aplikasi tersebut telah melalui proses review dan dinyatakan <strong>LAYAK</strong> untuk
                    diserahterimakan, dengan persetujuan sebagai berikut:
                  </p>
                  <table className="w-full text-xs mb-4 border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600">Peran</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600">Nama</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600">Status</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {app.reviewers.map(r => (
                        <tr key={r.role} className="border-t border-gray-100">
                          <td className="px-2.5 py-1.5">{r.role}</td>
                          <td className="px-2.5 py-1.5">{r.name}</td>
                          <td className="px-2.5 py-1.5">{r.status === 'approved' ? 'Disetujui' : r.status === 'approved_with_condition' ? 'Disetujui dgn Kondisi' : r.status}</td>
                          <td className="px-2.5 py-1.5">{r.reviewedAt || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mb-4">
                    Seluruh action item wajib terkait proses handover ini telah diselesaikan per tanggal
                    berita acara ini diterbitkan. Dokumen ini dihasilkan otomatis oleh sistem AHMS dan sah
                    tanpa memerlukan tanda tangan basah.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center text-xs mt-8">
                    {[
                      ['Project Manager', app.pic],
                      ['O&M Application Support', app.picOM],
                      ['Manager O&M', appState.users.find(u => u.role === 'Manager O&M')?.name || '-'],
                    ].map(([role, name]) => (
                      <div key={role}>
                        <div className="h-14" />
                        <div className="border-t border-gray-300 pt-1.5 font-medium text-gray-900">{name}</div>
                        <div className="text-gray-500">{role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right sidebar: AI Risk */}
        <div className="space-y-3">
          <Card padding={false}>
            <div
              className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer ${riskBg}`}
              onClick={() => setAiExpanded(e => !e)}
            >
              <div className="flex items-center gap-2">
                <Bot size={15} className="text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">AI Risk Insight</span>
              </div>
              {aiExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </div>
            {aiExpanded && (
              <div className="p-4">
                <div className="text-center mb-3.5">
                  <div
                    className="w-[72px] h-[72px] rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ background: `conic-gradient(${riskColor} ${app.riskScore * 3.6}deg, #e8edf3 0deg)` }}
                  >
                    <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center">
                      <span className="text-base font-extrabold" style={{ color: riskColor }}>{app.riskScore}</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold" style={{ color: riskColor }}>Risiko {riskLevel}</div>
                </div>
                {aiInsightReasons.length > 0 ? (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Faktor Risiko</div>
                    {aiInsightReasons.map((r, i) => (
                      <div key={i} className="flex gap-1.5 text-xs text-gray-700 py-1">
                        <span className="flex-shrink-0" style={{ color: riskColor }}>•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 text-center">Tidak ada faktor risiko teridentifikasi</p>
                )}
              </div>
            )}
          </Card>

          {/* Escalation */}
          {app.riskScore >= 50 && (
            <button
              onClick={() => setShowEscModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <Mail size={14} /> Generate Draft Eskalasi
            </button>
          )}
        </div>
      </div>

      {/* Escalation Modal */}
      <Modal
        open={showEscModal}
        onClose={() => { setShowEscModal(false); setCopied(false) }}
        title="Draft Email Eskalasi"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowEscModal(false); setCopied(false) }}>Tutup</Button>
            <Button
              variant={copied ? 'success' : 'primary'}
              onClick={async () => {
                // Bug lama: copy string placeholder 'Draft disalin!', bukan isi draft.
                // Sekarang copy escalationDraft yang sebenarnya, dan modal tetap
                // terbuka sebentar supaya feedback "Tersalin" terlihat.
                await navigator.clipboard?.writeText(escalationDraft)
                setCopied(true)
                setTimeout(() => { setCopied(false); setShowEscModal(false) }, 1200)
              }}
            >
              {copied ? '✓ Tersalin' : 'Salin Draft'}
            </Button>
          </>
        }
      >
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
          {escalationDraft}
        </div>
      </Modal>
    </div>
  )
}
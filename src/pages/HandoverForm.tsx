import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  FileCheck2,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react'
import type { AppState, Application, Criticality, Role } from '../types'
import type { Page } from '../App'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
  onAddApp: (app: Application) => void
}

type UploadStatus = 'done'
interface UploadState {
  file: File
  status: UploadStatus
  uploadedAt: string
}

const STEP_LABELS = ['Data Aplikasi', 'Upload Dokumen', 'Ringkasan']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg'

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
)

const inputCls = (err?: string) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-colors ${
    err ? 'border-red-400' : 'border-gray-300'
  }`

// Skor risiko dihitung otomatis dari kritikalitas (bobot dasar) + urgensi tanggal go-live
// (mirip matrix Impact x Urgency), sehingga PM langsung melihat estimasi risiko saat mengisi form
// alih-alih baru diketahui setelah submit.
function calculateRiskScore(criticality: Criticality, goLiveDate: string) {
  const base: Record<Criticality, number> = { Critical: 55, High: 40, Medium: 22, Low: 10 }
  let score = base[criticality]
  if (goLiveDate) {
    const days = Math.ceil((new Date(goLiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) score += 30
    else if (days <= 7) score += 25
    else if (days <= 30) score += 15
    else if (days <= 90) score += 5
  }
  return Math.max(0, Math.min(100, score))
}

function riskMeta(score: number) {
  if (score >= 70) return { label: 'Tinggi', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: '#dc2626' }
  if (score >= 40) return { label: 'Sedang', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: '#d97706' }
  return { label: 'Rendah', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: '#16A34A' }
}

export default function HandoverForm({ appState, currentUser, onNavigate, onAddApp }: Props) {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [newAppId, setNewAppId] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    criticality: 'Medium' as Criticality,
    businessOwner: '',
    pic: currentUser.name,
    picOM: '',
    reviewerTeknis: '',
    goLiveDate: '',
    technology: '',
    environment: '',
    category: '',
    vendor: '',
  })

  // Daftar dokumen wajib sekarang benar-benar mengikuti "Konfigurasi Checklist"
  // di Master Data (appState.checklistItems) — sebelumnya di sini ada array
  // 14 dokumen yang di-hardcode terpisah, sehingga halaman Master Data
  // mengklaim "perubahan di sini memengaruhi form handover" padahal
  // sebenarnya TIDAK ngefek sama sekali (checklistItems tidak pernah dibaca
  // di mana pun). Item generik (tanpa `category`) berlaku untuk semua
  // aplikasi sesuai kritikalitasnya; item dengan `category` cuma muncul
  // kalau Kategori Aplikasi yang dipilih cocok.
  const docTypes = useMemo(
    () =>
      appState.checklistItems
        .filter(ci => ci.criticality.includes(form.criticality))
        .filter(ci => !ci.category || ci.category.includes(form.category))
        .map(ci => ({ id: ci.id, name: ci.text, required: ci.required })),
    [appState.checklistItems, form.criticality, form.category],
  )

  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  // Live preview — ikut berubah setiap kali kritikalitas atau target go-live diubah
  const riskScore = useMemo(() => calculateRiskScore(form.criticality, form.goLiveDate), [form.criticality, form.goLiveDate])
  const risk = riskMeta(riskScore)

  // Daftar PIC O&M diambil dari user aktif dengan role O&M Application Support,
  // supaya assignment reviewer O&M mengikuti input PM, bukan nilai statis.
  const omStaff = useMemo(
    () => appState.users.filter(u => u.role === 'O&M Application Support' && u.active),
    [appState.users],
  )

  // Sama seperti PIC O&M — reviewer teknis dipilih dari user aktif dengan
  // role Reviewer Teknis, bukan nama hardcoded, supaya beban review tersebar
  // dan bukan selalu jatuh ke satu orang yang sama.
  const teknisReviewers = useMemo(
    () => appState.users.filter(u => u.role === 'Reviewer Teknis' && u.active),
    [appState.users],
  )

  function validateStep0() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nama aplikasi wajib diisi'
    if (!form.description.trim()) e.description = 'Deskripsi wajib diisi'
    if (!form.businessOwner.trim()) e.businessOwner = 'Business Owner wajib diisi'
    if (!form.pic.trim()) e.pic = 'PIC Project wajib diisi'
    if (!form.picOM.trim()) e.picOM = 'PIC O&M wajib diisi'
    if (!form.reviewerTeknis.trim()) e.reviewerTeknis = 'Reviewer Teknis wajib dipilih'
    if (!form.goLiveDate) e.goLiveDate = 'Tanggal go-live wajib diisi'
    if (!form.technology.trim()) e.technology = 'Teknologi wajib diisi'
    if (!form.environment) e.environment = 'Environment wajib dipilih'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    if (step === 0 && !validateStep0()) return
    setStep(s => s + 1)
  }

  // Klik pilih file -> langsung terupload, tanpa delay/spinner simulasi.
  function handleFileSelect(docId: string, files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setUploadErrors(prev => ({ ...prev, [docId]: 'Ukuran file maksimal 10MB' }))
      return
    }
    setUploadErrors(prev => {
      const next = { ...prev }
      delete next[docId]
      return next
    })

    const now = new Date()
    const uploadedAt = `${now.toTimeString().slice(0, 5)}`
    setUploads(prev => ({ ...prev, [docId]: { file, status: 'done', uploadedAt } }))
  }

  function removeUpload(docId: string) {
    setUploads(prev => {
      const next = { ...prev }
      delete next[docId]
      return next
    })
  }

  const requiredDocsUploaded = useMemo(
    () => docTypes.filter(d => d.required).every(d => uploads[d.id]?.status === 'done'),
    [docTypes, uploads],
  )

  // Dipisah wajib/opsional supaya PM langsung fokus ke dokumen yang memblokir step berikutnya.
  const requiredDocs = useMemo(() => docTypes.filter(d => d.required), [docTypes])
  const optionalDocs = useMemo(() => docTypes.filter(d => !d.required), [docTypes])
  const uploadedCount = useMemo(() => docTypes.filter(d => uploads[d.id]?.status === 'done').length, [docTypes, uploads])
  const uploadedRequiredCount = useMemo(() => requiredDocs.filter(d => uploads[d.id]?.status === 'done').length, [requiredDocs, uploads])
  const requiredProgressPct = requiredDocs.length > 0 ? Math.round((uploadedRequiredCount / requiredDocs.length) * 100) : 100

  function resetForm() {
    setStep(0)
    setSubmitted(false)
    setForm({ name: '', description: '', criticality: 'Medium', businessOwner: '', pic: currentUser.name, picOM: '', reviewerTeknis: '', goLiveDate: '', technology: '', environment: '', category: '', vendor: '' })
    setUploads({})
    setUploadErrors({})
  }

  function handleSubmit() {
    const id = `app-new-${Date.now()}`
    setNewAppId(id)
    const now = new Date().toISOString().slice(0, 10)
    const newApp: Application = {
      id,
      name: form.name,
      description: form.description,
      criticality: form.criticality,
      businessOwner: form.businessOwner,
      pic: form.pic,
      picOM: form.picOM,
      goLiveDate: form.goLiveDate,
      technology: form.technology,
      environment: form.environment,
      category: form.category || 'Umum',
      vendor: form.vendor || 'Lokal - Internal IT',
      status: 'Waiting for O&M Review',
      submittedDate: now,
      targetHandoverDate: form.goLiveDate,
      reviewers: [
        { role: 'Reviewer Teknis', name: form.reviewerTeknis, status: 'pending' },
        { role: 'O&M Application Support', name: form.picOM, status: 'pending' },
        { role: 'Business Owner', name: form.businessOwner, status: 'pending' },
      ],
      actionItems: [],
      documents: docTypes
        .filter(d => uploads[d.id]?.status === 'done')
        .map(d => ({ id: d.id, name: d.name, type: 'Document', uploaded: true, required: d.required, uploadedAt: now })),
      history: [
        { id: `h-${Date.now()}`, timestamp: `${now} ${new Date().toTimeString().slice(0, 5)}`, user: currentUser.name, action: 'Pengajuan handover dibuat dan dikirim ke O&M' },
      ],
      riskScore,
    }
    onAddApp(newApp)
    setSubmitted(true)
  }

  // Satu kartu dokumen dipakai ulang untuk grup Wajib maupun Opsional.
  // Klik area kartu (belum ada file) -> file picker terbuka -> pilih file -> langsung "done", tanpa spinner.
  function renderDocCard(doc: { id: string; name: string; required: boolean }) {
    const upload = uploads[doc.id]
    const done = upload?.status === 'done'
    const error = uploadErrors[doc.id]
    const inputId = `upload-${doc.id}`

    return (
      <div
        key={doc.id}
        className={`rounded-lg border transition-colors duration-200 ${
          done ? 'border-emerald-200 bg-emerald-50/50' :
          error ? 'border-red-300 bg-red-50/40' :
          'border-gray-200 bg-white hover:border-indigo-200'
        }`}
      >
        {!done && (
          <label htmlFor={inputId} className="flex items-center gap-3 px-3.5 py-3 cursor-pointer rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Upload size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 flex items-center gap-1.5 flex-wrap">
                {doc.name}
                {doc.required && <Badge variant="rejected">WAJIB</Badge>}
              </div>
              <div className={`text-xs mt-0.5 ${error ? 'text-red-600' : 'text-gray-400'}`}>
                {error || 'Klik untuk pilih file (PDF, DOC, XLS, ZIP — maks 10MB)'}
              </div>
            </div>
          </label>
        )}

        {done && (
          <div key={upload!.uploadedAt} className="flex items-center gap-3 px-3.5 py-3 animate-risk-pop">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileCheck2 size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 flex items-center gap-1.5 flex-wrap">
                {doc.name}
                {doc.required && <Badge variant="rejected">WAJIB</Badge>}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 truncate">
                {upload!.file.name} • {formatFileSize(upload!.file.size)} • {upload!.uploadedAt}
              </div>
            </div>
            <label htmlFor={inputId} className="text-xs text-indigo-600 hover:underline cursor-pointer flex-shrink-0">
              Ganti
            </label>
            <button
              type="button"
              onClick={() => removeUpload(doc.id)}
              className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <input
          id={inputId}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES}
          onChange={e => { handleFileSelect(doc.id, e.target.files); e.target.value = '' }}
        />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-8 sm:mt-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pengajuan Berhasil!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Aplikasi <strong className="text-gray-700">"{form.name}"</strong> telah diajukan dan statusnya sekarang{' '}
          <strong className="text-gray-700">"Waiting for O&M Review"</strong>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="w-full sm:w-auto justify-center" onClick={() => onNavigate('app-detail', newAppId)}>Lihat Detail Aplikasi</Button>
          <Button className="w-full sm:w-auto justify-center" variant="secondary" onClick={resetForm}>Ajukan Aplikasi Baru</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Ajukan Handover Aplikasi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Isi formulir multi-step untuk mengajukan proses handover aplikasi ke O&M</p>
      </div>

      {/* Stepper — di mobile label lengkap disembunyikan (hanya bulatan angka +
          garis) supaya tidak overflow horizontal; label step aktif ditampilkan
          ringkas di atasnya sebagai gantinya. */}
      <p className="sm:hidden text-xs font-semibold text-indigo-600 mb-2">
        Langkah {step + 1} dari {STEP_LABELS.length}: {STEP_LABELS[step]}
      </p>
      <div className="flex items-center mb-6 sm:mb-7">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className={`flex items-center ${i < STEP_LABELS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`hidden sm:inline text-xs whitespace-nowrap ${i === step ? 'font-semibold text-indigo-600' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px mx-2 sm:mx-3 ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="!p-4 sm:!p-7">
        {/* Step 0: Data Aplikasi */}
        {step === 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Step 1: Data Aplikasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <div className="md:col-span-2">
                <Field label="Nama Aplikasi *" error={errors.name}>
                  <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Nama lengkap aplikasi" className={inputCls(errors.name)} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Deskripsi *" error={errors.description}>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Jelaskan fungsi dan tujuan aplikasi" rows={3} className={`${inputCls(errors.description)} resize-y`} />
                </Field>
              </div>
              <Field label="Tingkat Kritikalitas *">
                <select value={form.criticality} onChange={e => f('criticality', e.target.value as Criticality)} className={inputCls()}>
                  {(['Critical', 'High', 'Medium', 'Low'] as Criticality[]).map(c => <option key={c}>{c}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {form.criticality === 'Critical' ? '⚠️ Kritis: dokumen & persyaratan paling ketat' :
                   form.criticality === 'High' ? '🔶 Tinggi: persyaratan security & DRP wajib' :
                   form.criticality === 'Medium' ? '🔷 Sedang: persyaratan standar' : '🔹 Rendah: persyaratan minimal'}
                </p>
              </Field>
              <Field label="Kategori">
                <select value={form.category} onChange={e => f('category', e.target.value)} className={inputCls()}>
                  <option value="">-- Pilih Kategori --</option>
                  {['Operations', 'Upstream', 'Production', 'Drilling', 'Integrity', 'HSE', 'Finance', 'Procurement', 'Supply Chain', 'Trading', 'Analytics', 'Geoscience', 'Geospatial', 'Asset', 'Maintenance', 'Laboratory', 'Compliance', 'HR', 'Document'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Business Owner *" error={errors.businessOwner}>
                <input value={form.businessOwner} onChange={e => f('businessOwner', e.target.value)} placeholder="Nama business owner" className={inputCls(errors.businessOwner)} />
              </Field>
              <Field label="PIC Project *" error={errors.pic}>
                <select value={form.pic} onChange={e => f('pic', e.target.value)} className={inputCls(errors.pic)}>
                  <option value={currentUser.name}>{currentUser.name} (saya)</option>
                  {appState.picList.map(p => p.name !== currentUser.name ? <option key={p.id} value={p.name}>{p.name} — {p.department}</option> : null)}
                </select>
              </Field>
              <Field label="PIC O&M *" error={errors.picOM}>
                <select value={form.picOM} onChange={e => f('picOM', e.target.value)} className={inputCls(errors.picOM)}>
                  <option value="">-- Pilih PIC O&M --</option>
                  {omStaff.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Penanggung jawab O&M yang akan menerima aplikasi ini setelah handover
                </p>
              </Field>
              <Field label="Reviewer Teknis *" error={errors.reviewerTeknis}>
                <select value={form.reviewerTeknis} onChange={e => f('reviewerTeknis', e.target.value)} className={inputCls(errors.reviewerTeknis)}>
                  <option value="">-- Pilih Reviewer Teknis --</option>
                  {teknisReviewers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Akan meninjau aspek teknis & keamanan sebelum aplikasi disetujui
                </p>
              </Field>
              <Field label="Target Go-Live *" error={errors.goLiveDate}>
                <input type="date" value={form.goLiveDate} onChange={e => f('goLiveDate', e.target.value)} className={inputCls(errors.goLiveDate)} />
              </Field>
              <Field label="Vendor / Developer">
                <select value={form.vendor} onChange={e => f('vendor', e.target.value)} className={inputCls()}>
                  <option value="">-- Pilih Vendor --</option>
                  {appState.vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </Field>
              <Field label="Stack Teknologi *" error={errors.technology}>
                <input value={form.technology} onChange={e => f('technology', e.target.value)} placeholder="Contoh: React, Node.js, PostgreSQL" className={inputCls(errors.technology)} />
              </Field>
              <Field label="Environment *" error={errors.environment}>
                <select value={form.environment} onChange={e => f('environment', e.target.value)} className={inputCls(errors.environment)}>
                  <option value="">-- Pilih Environment --</option>
                  {appState.environments.map(env => <option key={env.id} value={env.name}>{env.name}</option>)}
                </select>
              </Field>

              {/* Skor risiko otomatis — live, ikut berubah saat kritikalitas / go-live diedit */}
              <div className="md:col-span-2">
                <div className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 transition-colors duration-300 ${risk.bg} ${risk.border}`}>
                  <span className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Info size={14} className="text-gray-400 flex-shrink-0" />
                    Estimasi Skor Risiko (otomatis)
                  </span>
                  <span
                    key={riskScore}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-white animate-risk-pop ${risk.color} ${risk.border}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: risk.dot }} />
                    {riskScore} — Risiko {risk.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Dihitung dari tingkat kritikalitas dan urgensi tanggal go-live (mirip skema Impact × Urgency). Skor final tetap dapat disesuaikan tim O&M saat review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Upload Dokumen — pilih file langsung terupload (tanpa delay/spinner) */}
        {step === 1 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Step 2: Upload Dokumen</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {uploadedCount} dari {docTypes.length} dokumen terupload
                </p>
              </div>
              <div className="w-full sm:w-40 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-gray-500">Dokumen Wajib</span>
                  <span className={`text-[11px] font-bold ${requiredDocsUploaded ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {uploadedRequiredCount}/{requiredDocs.length}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${requiredDocsUploaded ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${requiredProgressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Grup Wajib */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Dokumen Wajib</span>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {requiredDocs.map(doc => renderDocCard(doc))}
              </div>
            </div>

            {/* Grup Opsional */}
            {optionalDocs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Dokumen Opsional</span>
                  <span className="h-px flex-1 bg-gray-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {optionalDocs.map(doc => renderDocCard(doc))}
                </div>
              </div>
            )}

            {!requiredDocsUploaded && (
              <p className="flex items-start gap-2 text-xs text-amber-700 mt-4 px-3 py-2 bg-amber-50 rounded-lg">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                Upload semua dokumen bertanda WAJIB untuk melanjutkan ke step berikutnya.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Ringkasan */}
        {step === 2 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Step 3: Ringkasan Pengajuan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-gray-50 rounded-lg p-4 mb-5">
              {[
                ['Nama Aplikasi', form.name],
                ['Kritikalitas', form.criticality],
                ['Skor Risiko (otomatis)', `${riskScore} — Risiko ${risk.label}`],
                ['Business Owner', form.businessOwner],
                ['PIC Project', form.pic],
                ['PIC O&M', form.picOM],
                ['Reviewer Teknis', form.reviewerTeknis],
                ['Target Go-Live', form.goLiveDate],
                ['Environment', form.environment],
                ['Teknologi', form.technology],
                ['Vendor', form.vendor || 'Internal IT'],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                  <div className="text-sm text-gray-900 font-medium break-words">{value}</div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500 font-medium">Deskripsi</div>
                <div className="text-sm text-gray-900 break-words">{form.description}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500 font-medium">Dokumen Terupload</div>
                <div className="text-sm text-gray-900">
                  {docTypes.filter(d => uploads[d.id]?.status === 'done').length} dari {docTypes.length} dokumen
                </div>
              </div>
            </div>
            <p className="flex items-start gap-2 px-3.5 py-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <Info size={15} className="flex-shrink-0 mt-0.5" />
              Dengan mengklik <strong>Submit Pengajuan</strong>, status aplikasi akan berubah menjadi <strong>"Waiting for O&M Review"</strong> dan notifikasi akan dikirim ke tim O&M.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft size={14} /> Kembali
          </Button>
          {step < 2 ? (
            <Button onClick={nextStep} disabled={step === 1 && !requiredDocsUploaded}>
              Lanjut <ChevronRight size={14} />
            </Button>
          ) : (
            <Button variant="success" onClick={handleSubmit}>
              <CheckCircle2 size={14} /> Submit Pengajuan
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
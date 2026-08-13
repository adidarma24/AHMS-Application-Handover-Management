import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  FileCheck2,
  X,
  CheckCircle2,
  ClipboardCheck,
  Info,
} from 'lucide-react'
import type { AppState, Application, Criticality, Role } from '../types'
import type { Page } from '../App'
import { INITIAL_CHECKLIST_ITEMS } from '../data'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
  onAddApp: (app: Application) => void
}

type UploadStatus = 'uploading' | 'done'
interface UploadState {
  file: File
  status: UploadStatus
}

const STEP_LABELS = ['Data Aplikasi', 'Upload Dokumen', 'Checklist', 'Ringkasan']
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
    goLiveDate: '',
    technology: '',
    environment: '',
    category: '',
    vendor: '',
  })

  // Daftar dokumen wajib mengikuti Alur Utama poin 3 pada use case AHMS.
  // Item yang menyangkut security/performance/backup tetap mengikuti kritikalitas,
  // sisanya wajib untuk semua aplikasi.
  const docTypes = useMemo(
    () => [
      { id: 'd-new-1', name: 'Dokumen Arsitektur Aplikasi', required: true },
      { id: 'd-new-2', name: 'Dokumen Desain Teknis', required: true },
      { id: 'd-new-3', name: 'Dokumen Konfigurasi Environment', required: true },
      { id: 'd-new-4', name: 'SOP Operasional', required: true },
      { id: 'd-new-5', name: 'SOP Penanganan Gangguan (Incident Handling)', required: true },
      { id: 'd-new-6', name: 'User Manual', required: true },
      { id: 'd-new-7', name: 'Administrator Manual', required: true },
      { id: 'd-new-8', name: 'Hasil UAT (User Acceptance Test)', required: true },
      { id: 'd-new-9', name: 'Hasil Security Assessment / Vulnerability Assessment', required: form.criticality === 'Critical' || form.criticality === 'High' },
      { id: 'd-new-10', name: 'Hasil Performance Test', required: form.criticality === 'Critical' || form.criticality === 'High' },
      { id: 'd-new-11', name: 'Daftar Open Defect & Known Issue', required: true },
      { id: 'd-new-12', name: 'Dokumen Backup & Recovery', required: form.criticality !== 'Low' },
      { id: 'd-new-13', name: 'Daftar Kontak Vendor / Pihak Ketiga', required: true },
      { id: 'd-new-14', name: 'Source Code Repository & Informasi Versioning', required: true },
    ],
    [form.criticality],
  )

  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})

  // Checklist dibedakan berdasarkan KATEGORI dan KRITIKALITAS aplikasi
  // (Kebutuhan Fungsional #3). Item tanpa `category` berlaku untuk semua kategori.
  const checklistItems = useMemo(
    () => INITIAL_CHECKLIST_ITEMS.filter(ci =>
      ci.criticality.includes(form.criticality) &&
      (!ci.category || ci.category.length === 0 || ci.category.includes(form.category))
    ),
    [form.criticality, form.category],
  )
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  // Daftar PIC O&M diambil dari user aktif dengan role O&M Application Support,
  // supaya assignment reviewer O&M mengikuti input PM, bukan nilai statis.
  const omStaff = useMemo(
    () => appState.users.filter(u => u.role === 'O&M Application Support' && u.active),
    [appState.users],
  )

  function validateStep0() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nama aplikasi wajib diisi'
    if (!form.description.trim()) e.description = 'Deskripsi wajib diisi'
    if (!form.businessOwner.trim()) e.businessOwner = 'Business Owner wajib diisi'
    if (!form.pic.trim()) e.pic = 'PIC Project wajib diisi'
    if (!form.picOM.trim()) e.picOM = 'PIC O&M wajib diisi'
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

  // Simulasi upload dokumen sungguhan: pilih file -> status "uploading" (spinner) -> "done"
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

    setUploads(prev => ({ ...prev, [docId]: { file, status: 'uploading' } }))

    const delay = 500 + Math.random() * 700
    window.setTimeout(() => {
      setUploads(prev => (prev[docId]?.file === file ? { ...prev, [docId]: { file, status: 'done' } } : prev))
    }, delay)
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

  function resetForm() {
    setStep(0)
    setSubmitted(false)
    setForm({ name: '', description: '', criticality: 'Medium', businessOwner: '', pic: currentUser.name, picOM: '', goLiveDate: '', technology: '', environment: '', category: '', vendor: '' })
    setUploads({})
    setUploadErrors({})
    setCheckedItems({})
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
        { role: 'Reviewer Teknis', name: 'Reza Firmansyah', status: 'pending' },
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
      riskScore: form.criticality === 'Critical' ? 40 : form.criticality === 'High' ? 25 : 15,
    }
    onAddApp(newApp)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pengajuan Berhasil!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Aplikasi <strong className="text-gray-700">"{form.name}"</strong> telah diajukan dan statusnya sekarang{' '}
          <strong className="text-gray-700">"Waiting for O&M Review"</strong>
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => onNavigate('app-detail', newAppId)}>Lihat Detail Aplikasi</Button>
          <Button variant="secondary" onClick={resetForm}>Ajukan Aplikasi Baru</Button>
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

      {/* Stepper */}
      <div className="flex items-center mb-7">
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
              <span className={`text-xs whitespace-nowrap ${i === step ? 'font-semibold text-indigo-600' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="!p-7">
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
                  {form.criticality === 'Critical' ? '⚠️ Kritis: checklist & persyaratan paling ketat' :
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
            </div>
          </div>
        )}

        {/* Step 1: Upload Dokumen — simulasi upload file sungguhan */}
        {step === 1 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Step 2: Upload Dokumen</h3>
            <div className="flex flex-col gap-2.5">
              {docTypes.map(doc => {
                const upload = uploads[doc.id]
                const status = upload?.status
                const inputId = `upload-${doc.id}`
                return (
                  <div
                    key={doc.id}
                    className={`rounded-lg border transition-colors ${
                      status === 'done' ? 'border-emerald-200 bg-emerald-50/50' :
                      status === 'uploading' ? 'border-indigo-200 bg-indigo-50/40' :
                      uploadErrors[doc.id] ? 'border-red-300 bg-red-50/40' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    {!status && (
                      <label htmlFor={inputId} className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Upload size={16} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 flex items-center gap-1.5 flex-wrap">
                            {doc.name}
                            {doc.required && <Badge variant="rejected">WAJIB</Badge>}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {uploadErrors[doc.id] || 'Klik untuk pilih file (PDF, DOC, XLS, ZIP — maks 10MB)'}
                          </div>
                        </div>
                      </label>
                    )}

                    {status === 'uploading' && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Loader2 size={16} className="text-indigo-600 animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate">{upload!.file.name}</div>
                          <div className="text-xs text-indigo-500 mt-0.5">Mengupload...</div>
                        </div>
                      </div>
                    )}

                    {status === 'done' && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <FileCheck2 size={16} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 flex items-center gap-1.5 flex-wrap">
                            {doc.name}
                            {doc.required && <Badge variant="rejected">WAJIB</Badge>}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {upload!.file.name} • {formatFileSize(upload!.file.size)}
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
              })}
            </div>
            {!requiredDocsUploaded && (
              <p className="flex items-start gap-2 text-xs text-amber-700 mt-3 px-3 py-2 bg-amber-50 rounded-lg">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                Upload semua dokumen bertanda WAJIB untuk melanjutkan ke step berikutnya.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Checklist */}
        {step === 2 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Step 3: Checklist Readiness</h3>
            <p className="text-xs text-gray-500 mb-4">
              Checklist di bawah disesuaikan dengan kategori <strong>{form.category || 'Umum'}</strong> dan kritikalitas <strong>{form.criticality}</strong> ({checklistItems.length} item)
            </p>
            <div className="flex flex-col gap-2">
              {checklistItems.map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    checkedItems[item.id] ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkedItems[item.id] || false}
                    onChange={e => setCheckedItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                    className="mt-0.5 flex-shrink-0 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-900 flex-1">{item.text}</span>
                  {item.required && <Badge variant="rejected">WAJIB</Badge>}
                </label>
              ))}
            </div>
            <div className="mt-3.5 px-3.5 py-2.5 bg-gray-50 rounded-lg text-xs text-gray-700 flex items-center gap-1.5">
              <ClipboardCheck size={13} className="text-gray-400" />
              {Object.values(checkedItems).filter(Boolean).length} dari {checklistItems.length} item telah dicentang
            </div>
          </div>
        )}

        {/* Step 3: Ringkasan */}
        {step === 3 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Step 4: Ringkasan Pengajuan</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-gray-50 rounded-lg p-4 mb-5">
              {[
                ['Nama Aplikasi', form.name],
                ['Kritikalitas', form.criticality],
                ['Business Owner', form.businessOwner],
                ['PIC Project', form.pic],
                ['PIC O&M', form.picOM],
                ['Target Go-Live', form.goLiveDate],
                ['Environment', form.environment],
                ['Teknologi', form.technology],
                ['Vendor', form.vendor || 'Internal IT'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                  <div className="text-sm text-gray-900 font-medium">{value}</div>
                </div>
              ))}
              <div className="col-span-2">
                <div className="text-xs text-gray-500 font-medium">Deskripsi</div>
                <div className="text-sm text-gray-900">{form.description}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 font-medium">Dokumen Terupload</div>
                <div className="text-sm text-gray-900">
                  {docTypes.filter(d => uploads[d.id]?.status === 'done').length} dari {docTypes.length} dokumen
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 font-medium">Checklist Readiness</div>
                <div className="text-sm text-gray-900">
                  {Object.values(checkedItems).filter(Boolean).length} dari {checklistItems.length} item tercentang
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
          {step < 3 ? (
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
import { useState } from 'react'
import type { AppState, Application, Criticality, Role } from '../types'
import type { Page } from '../App'
import { INITIAL_CHECKLIST_ITEMS } from '../data'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
  onAddApp: (app: Application) => void
}

const STEP_LABELS = ['Data Aplikasi', 'Upload Dokumen', 'Checklist', 'Ringkasan']

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{label}</label>
    {children}
    {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 3 }}>{error}</p>}
  </div>
)

const inputStyle = (err?: string): React.CSSProperties => ({
  width: '100%', padding: '9px 12px', borderRadius: 7, boxSizing: 'border-box',
  border: `1px solid ${err ? '#dc2626' : '#d1d5db'}`, fontSize: 13, color: '#111827', outline: 'none',
})

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
    goLiveDate: '',
    technology: '',
    environment: '',
    category: '',
    vendor: '',
  })

  const docTypes = [
    { id: 'd-new-1', name: 'Business Requirements Document (BRD)', required: true },
    { id: 'd-new-2', name: 'System Requirements Specification (SRS)', required: true },
    { id: 'd-new-3', name: 'User Manual / Panduan Pengguna', required: true },
    { id: 'd-new-4', name: 'Architecture & Technical Design', required: true },
    { id: 'd-new-5', name: 'SLA Agreement', required: form.criticality !== 'Low' },
    { id: 'd-new-6', name: 'Security Assessment Report', required: form.criticality === 'Critical' || form.criticality === 'High' },
    { id: 'd-new-7', name: 'DRP / Backup Recovery Plan', required: form.criticality === 'Critical' || form.criticality === 'High' },
    { id: 'd-new-8', name: 'UAT Sign-off Document', required: false },
  ]

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({})

  const checklistItems = INITIAL_CHECKLIST_ITEMS.filter(ci => ci.criticality.includes(form.criticality))
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  function validateStep0() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nama aplikasi wajib diisi'
    if (!form.description.trim()) e.description = 'Deskripsi wajib diisi'
    if (!form.businessOwner.trim()) e.businessOwner = 'Business Owner wajib diisi'
    if (!form.pic.trim()) e.pic = 'PIC wajib diisi'
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

  const requiredDocsUploaded = docTypes.filter(d => d.required).every(d => uploadedDocs[d.id])

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
        { role: 'O&M Application Support', name: 'Sari Dewi', status: 'pending' },
        { role: 'Business Owner', name: form.businessOwner, status: 'pending' },
      ],
      actionItems: [],
      documents: docTypes
        .filter(d => uploadedDocs[d.id])
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
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 8px' }}>Pengajuan Berhasil!</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Aplikasi <strong>"{form.name}"</strong> telah diajukan dan statusnya sekarang <strong>"Waiting for O&M Review"</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => onNavigate('app-detail', newAppId)}
            style={{ padding: '10px 20px', borderRadius: 8, background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >Lihat Detail Aplikasi</button>
          <button
            onClick={() => { setStep(0); setSubmitted(false); setForm({ name: '', description: '', criticality: 'Medium', businessOwner: '', pic: currentUser.name, goLiveDate: '', technology: '', environment: '', category: '', vendor: '' }); setUploadedDocs({}); setCheckedItems({}) }}
            style={{ padding: '10px 20px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >Ajukan Aplikasi Baru</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1a2332' }}>Ajukan Handover Aplikasi</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Isi formulir multi-step untuk mengajukan proses handover aplikasi ke O&M</p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        {STEP_LABELS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: i < step ? '#16A34A' : i === step ? '#2563EB' : '#e5e7eb',
                color: i <= step ? 'white' : '#6b7280',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 400, color: i === step ? '#2563EB' : '#6b7280', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? '#16A34A' : '#e5e7eb', margin: '0 12px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e8edf3' }}>
        {/* Step 0 */}
        {step === 0 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: '#1a2332' }}>Step 1: Data Aplikasi</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Nama Aplikasi *" error={errors.name}>
                  <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Nama lengkap aplikasi" style={inputStyle(errors.name)} />
                </Field>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Deskripsi *" error={errors.description}>
                  <textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Jelaskan fungsi dan tujuan aplikasi" rows={3} style={{ ...inputStyle(errors.description), resize: 'vertical' }} />
                </Field>
              </div>
              <Field label="Tingkat Kritikalitas *">
                <select value={form.criticality} onChange={e => f('criticality', e.target.value as Criticality)} style={inputStyle()}>
                  {(['Critical', 'High', 'Medium', 'Low'] as Criticality[]).map(c => <option key={c}>{c}</option>)}
                </select>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                  {form.criticality === 'Critical' ? '⚠️ Kritis: checklist & persyaratan paling ketat' :
                   form.criticality === 'High' ? '🔶 Tinggi: persyaratan security & DRP wajib' :
                   form.criticality === 'Medium' ? '🔷 Sedang: persyaratan standar' : '🔹 Rendah: persyaratan minimal'}
                </p>
              </Field>
              <Field label="Kategori">
                <select value={form.category} onChange={e => f('category', e.target.value)} style={inputStyle()}>
                  <option value="">-- Pilih Kategori --</option>
                  {['Operations', 'Upstream', 'Integrity', 'HSE', 'Finance', 'Procurement', 'Analytics', 'Asset', 'HR', 'Document'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Business Owner *" error={errors.businessOwner}>
                <input value={form.businessOwner} onChange={e => f('businessOwner', e.target.value)} placeholder="Nama business owner" style={inputStyle(errors.businessOwner)} />
              </Field>
              <Field label="PIC / Person in Charge *" error={errors.pic}>
                <select value={form.pic} onChange={e => f('pic', e.target.value)} style={inputStyle(errors.pic)}>
                  <option value={currentUser.name}>{currentUser.name} (saya)</option>
                  {appState.picList.map(p => p.name !== currentUser.name ? <option key={p.id} value={p.name}>{p.name} — {p.department}</option> : null)}
                </select>
              </Field>
              <Field label="Target Go-Live *" error={errors.goLiveDate}>
                <input type="date" value={form.goLiveDate} onChange={e => f('goLiveDate', e.target.value)} style={inputStyle(errors.goLiveDate)} />
              </Field>
              <Field label="Vendor / Developer">
                <select value={form.vendor} onChange={e => f('vendor', e.target.value)} style={inputStyle()}>
                  <option value="">-- Pilih Vendor --</option>
                  {appState.vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </Field>
              <Field label="Stack Teknologi *" error={errors.technology}>
                <input value={form.technology} onChange={e => f('technology', e.target.value)} placeholder="Contoh: React, Node.js, PostgreSQL" style={inputStyle(errors.technology)} />
              </Field>
              <Field label="Environment *" error={errors.environment}>
                <select value={form.environment} onChange={e => f('environment', e.target.value)} style={inputStyle(errors.environment)}>
                  <option value="">-- Pilih Environment --</option>
                  {appState.environments.map(env => <option key={env.id} value={env.name}>{env.name}</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: '#1a2332' }}>Step 2: Upload Dokumen</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docTypes.map(doc => (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  border: `1px solid ${uploadedDocs[doc.id] ? '#bbf7d0' : '#e5e7eb'}`,
                  borderRadius: 8, background: uploadedDocs[doc.id] ? '#f0fdf4' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onClick={() => setUploadedDocs(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, border: `2px solid ${uploadedDocs[doc.id] ? '#16A34A' : '#d1d5db'}`,
                    background: uploadedDocs[doc.id] ? '#16A34A' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 11, color: 'white', fontWeight: 700,
                  }}>
                    {uploadedDocs[doc.id] ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: '#1a2332' }}>{doc.name}</span>
                    {doc.required && <span style={{ marginLeft: 6, fontSize: 10, color: '#dc2626', fontWeight: 600 }}>WAJIB</span>}
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: uploadedDocs[doc.id] ? '#dcfce7' : doc.required ? '#fef2f2' : '#f9fafb',
                    color: uploadedDocs[doc.id] ? '#16A34A' : doc.required ? '#dc2626' : '#6b7280',
                  }}>
                    {uploadedDocs[doc.id] ? '✓ Terupload' : doc.required ? 'Wajib Upload' : 'Opsional'}
                  </div>
                </div>
              ))}
            </div>
            {!requiredDocsUploaded && (
              <p style={{ fontSize: 12, color: '#d97706', marginTop: 12, padding: '8px 12px', background: '#fefce8', borderRadius: 6 }}>
                ⚠ Klik pada dokumen wajib (WAJIB) untuk menandai sudah terupload. Tombol Lanjut aktif setelah semua dokumen wajib ditandai.
              </p>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: '#1a2332' }}>Step 3: Checklist Readiness</h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>
              Checklist di bawah disesuaikan dengan kritikalitas <strong>{form.criticality}</strong> ({checklistItems.length} item)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checklistItems.map(item => (
                <label key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                  border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer',
                  background: checkedItems[item.id] ? '#f0fdf4' : 'white',
                }}>
                  <input
                    type="checkbox"
                    checked={checkedItems[item.id] || false}
                    onChange={e => setCheckedItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: '#1a2332', flex: 1 }}>{item.text}</span>
                  {item.required && <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, flexShrink: 0 }}>WAJIB</span>}
                </label>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#374151' }}>
              ✓ {Object.values(checkedItems).filter(Boolean).length} dari {checklistItems.length} item telah dicentang
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#1a2332' }}>Step 4: Ringkasan Pengajuan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              {[
                ['Nama Aplikasi', form.name],
                ['Kritikalitas', form.criticality],
                ['Business Owner', form.businessOwner],
                ['PIC', form.pic],
                ['Target Go-Live', form.goLiveDate],
                ['Environment', form.environment],
                ['Teknologi', form.technology],
                ['Vendor', form.vendor || 'Internal IT'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#1a2332', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Deskripsi</div>
                <div style={{ fontSize: 13, color: '#1a2332' }}>{form.description}</div>
              </div>
            </div>
            <div style={{ padding: 14, background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1e40af' }}>
              ℹ Dengan mengklik <strong>Submit Pengajuan</strong>, status aplikasi akan berubah menjadi <strong>"Waiting for O&M Review"</strong> dan notifikasi akan dikirim ke tim O&M.
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            style={{
              padding: '9px 18px', borderRadius: 7, border: '1px solid #e5e7eb',
              background: 'white', color: '#374151', cursor: step === 0 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, opacity: step === 0 ? 0.4 : 1,
            }}
          >
            ← Kembali
          </button>
          {step < 3 ? (
            <button
              onClick={nextStep}
              disabled={step === 1 && !requiredDocsUploaded}
              style={{
                padding: '9px 20px', borderRadius: 7, border: 'none',
                background: (step === 1 && !requiredDocsUploaded) ? '#9ca3af' : '#2563EB',
                color: 'white', cursor: (step === 1 && !requiredDocsUploaded) ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              Lanjut →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#16A34A', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              ✓ Submit Pengajuan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
import { useMemo, useState } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import type { AppState, MasterPIC, MasterVendor, MasterEnvironment, ChecklistItem, Criticality } from '../types'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { APPLICATION_CATEGORIES } from '../lib/categories'

interface Props {
  appState: AppState
  onUpdateState: (updates: Partial<AppState>) => void
}

type Section = 'pic' | 'vendor' | 'environment' | 'users' | 'checklist'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'pic', label: 'Master PIC' },
  { id: 'vendor', label: 'Master Vendor' },
  { id: 'environment', label: 'Environment' },
  { id: 'users', label: 'Role & Akses' },
  { id: 'checklist', label: 'Konfigurasi Checklist' },
]

const CRIT_OPTIONS: Criticality[] = ['Critical', 'High', 'Medium', 'Low']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
)

const inputCls = (err?: string) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-colors ${
    err ? 'border-red-400' : 'border-gray-300'
  }`

const critBadgeVariant = (c: string) => c.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'

export default function MasterData({ appState, onUpdateState }: Props) {
  const [section, setSection] = useState<Section>('pic')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  function changeSection(s: Section) {
    setSection(s)
    setSearch('')
    setShowModal(false)
    setFormErrors({})
  }

  function openAdd() {
    setEditId(null)
    setFormData({})
    setFormErrors({})
    setShowModal(true)
  }

  function openEdit(id: string, data: Record<string, string>) {
    setEditId(id)
    setFormData(data)
    setFormErrors({})
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setFormErrors({})
  }

  const f = (k: string, v: string) => setFormData(prev => ({ ...prev, [k]: v }))

  // Validasi mencegah data kosong/duplikat tersimpan — sebelumnya klik "Tambah" lalu
  // langsung "Simpan" tanpa isi apa pun akan membuat baris kosong yang ikut muncul
  // di dropdown PIC/Vendor/Environment pada halaman lain (mis. HandoverForm).
  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    const name = (formData.name || '').trim()

    if (section === 'pic') {
      if (!name) e.name = 'Nama wajib diisi'
      else if (appState.picList.some(p => p.id !== editId && p.name.trim().toLowerCase() === name.toLowerCase()))
        e.name = 'Nama PIC sudah terdaftar'
      const email = (formData.email || '').trim()
      if (!email) e.email = 'Email wajib diisi'
      else if (!EMAIL_RE.test(email)) e.email = 'Format email tidak valid'
      if (!(formData.department || '').trim()) e.department = 'Departemen wajib diisi'
    } else if (section === 'vendor') {
      if (!name) e.name = 'Nama vendor wajib diisi'
      else if (appState.vendors.some(v => v.id !== editId && v.name.trim().toLowerCase() === name.toLowerCase()))
        e.name = 'Nama vendor sudah terdaftar'
      if (!(formData.category || '').trim()) e.category = 'Kategori wajib diisi'
      const email = (formData.email || '').trim()
      if (email && !EMAIL_RE.test(email)) e.email = 'Format email tidak valid'
    } else if (section === 'environment') {
      if (!name) e.name = 'Nama environment wajib diisi'
      else if (appState.environments.some(en => en.id !== editId && en.name.trim().toLowerCase() === name.toLowerCase()))
        e.name = 'Nama environment sudah terdaftar'
    } else if (section === 'checklist') {
      if (!(formData.text || '').trim()) e.text = 'Teks item checklist wajib diisi'
      const crit = (formData.criticality || '').split(',').filter(Boolean)
      if (crit.length === 0) e.criticality = 'Pilih minimal satu kritikalitas'
    }
    return e
  }

  function handleSavePIC() {
    const item: MasterPIC = {
      id: editId || `p-${Date.now()}`,
      name: formData.name!.trim(),
      email: formData.email!.trim(),
      department: formData.department!.trim(),
      phone: (formData.phone || '').trim(),
    }
    const list = editId ? appState.picList.map(p => (p.id === editId ? item : p)) : [...appState.picList, item]
    onUpdateState({ picList: list })
  }

  function handleSaveVendor() {
    const item: MasterVendor = {
      id: editId || `v-${Date.now()}`,
      name: formData.name!.trim(),
      contact: (formData.contact || '').trim(),
      email: (formData.email || '').trim(),
      category: formData.category!.trim(),
    }
    const list = editId ? appState.vendors.map(v => (v.id === editId ? item : v)) : [...appState.vendors, item]
    onUpdateState({ vendors: list })
  }

  function handleSaveEnv() {
    const item: MasterEnvironment = {
      id: editId || `e-${Date.now()}`,
      name: formData.name!.trim(),
      description: (formData.description || '').trim(),
      server: (formData.server || '').trim(),
    }
    const list = editId ? appState.environments.map(e => (e.id === editId ? item : e)) : [...appState.environments, item]
    onUpdateState({ environments: list })
  }

  function handleSaveChecklist() {
    const category = (formData.category || '').split(',').filter(Boolean)
    const item: ChecklistItem = {
      id: editId || `cl-${Date.now()}`,
      text: formData.text!.trim(),
      criticality: (formData.criticality || '').split(',').filter(Boolean) as Criticality[],
      required: formData.required === 'true',
      ...(category.length > 0 ? { category } : {}),
    }
    const list = editId ? appState.checklistItems.map(c => (c.id === editId ? item : c)) : [...appState.checklistItems, item]
    onUpdateState({ checklistItems: list })
  }

  function handleSave() {
    const e = validate()
    setFormErrors(e)
    if (Object.keys(e).length > 0) return
    if (section === 'pic') handleSavePIC()
    else if (section === 'vendor') handleSaveVendor()
    else if (section === 'environment') handleSaveEnv()
    else if (section === 'checklist') handleSaveChecklist()
    closeModal()
  }

  function handleDelete(id: string) {
    if (section === 'pic') onUpdateState({ picList: appState.picList.filter(p => p.id !== id) })
    else if (section === 'vendor') onUpdateState({ vendors: appState.vendors.filter(v => v.id !== id) })
    else if (section === 'environment') onUpdateState({ environments: appState.environments.filter(e => e.id !== id) })
    else if (section === 'checklist') onUpdateState({ checklistItems: appState.checklistItems.filter(c => c.id !== id) })
    setDeleteConfirm(null)
  }

  function toggleUser(userId: string) {
    onUpdateState({ users: appState.users.map(u => (u.id === userId ? { ...u, active: !u.active } : u)) })
  }

  // Pencarian per section — dimemoize supaya hanya dihitung ulang saat data atau kata kunci berubah
  const q = search.trim().toLowerCase()
  const filteredPIC = useMemo(
    () => appState.picList.filter(p => !q || [p.name, p.department, p.email, p.phone].some(v => v.toLowerCase().includes(q))),
    [appState.picList, q],
  )
  const filteredVendors = useMemo(
    () => appState.vendors.filter(v => !q || [v.name, v.category, v.contact, v.email].some(val => val.toLowerCase().includes(q))),
    [appState.vendors, q],
  )
  const filteredEnvs = useMemo(
    () => appState.environments.filter(e => !q || [e.name, e.description, e.server].some(v => v.toLowerCase().includes(q))),
    [appState.environments, q],
  )
  const filteredUsers = useMemo(
    () => appState.users.filter(u => !q || [u.name, u.role, u.email].some(v => v.toLowerCase().includes(q))),
    [appState.users, q],
  )
  const filteredChecklist = useMemo(
    () => appState.checklistItems.filter(c => !q || c.text.toLowerCase().includes(q)),
    [appState.checklistItems, q],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Master Data & Konfigurasi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola data referensi dan konfigurasi sistem AHMS</p>
      </div>

      <Card padding={false}>
        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => changeSection(s.id)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                section === s.id
                  ? 'border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* PIC */}
          {section === 'pic' && (
            <TableSection
              title="Daftar PIC"
              onAdd={openAdd}
              cols={['Nama', 'Departemen', 'Email', 'Telepon']}
              rows={filteredPIC.map(p => ({
                id: p.id,
                cells: [p.name, p.department, p.email, p.phone],
                data: { name: p.name, email: p.email, department: p.department, phone: p.phone },
              }))}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari PIC..."
            />
          )}

          {/* Vendor */}
          {section === 'vendor' && (
            <TableSection
              title="Daftar Vendor"
              onAdd={openAdd}
              cols={['Nama Vendor', 'Kategori', 'Contact Person', 'Email']}
              rows={filteredVendors.map(v => ({
                id: v.id,
                cells: [v.name, v.category, v.contact, v.email],
                data: { name: v.name, contact: v.contact, email: v.email, category: v.category },
              }))}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari vendor..."
            />
          )}

          {/* Environment */}
          {section === 'environment' && (
            <TableSection
              title="Daftar Environment"
              onAdd={openAdd}
              cols={['Nama', 'Deskripsi', 'Server']}
              rows={filteredEnvs.map(e => ({
                id: e.id,
                cells: [e.name, e.description, e.server],
                data: { name: e.name, description: e.description, server: e.server },
              }))}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari environment..."
            />
          )}

          {/* Users */}
          {section === 'users' && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900">User & Akses</h3>
                <SearchBox value={search} onChange={setSearch} placeholder="Cari user..." />
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Nama', 'Role', 'Email', 'Status', ''].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-b-0">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{user.name}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{user.role}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">{user.email}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant={user.active ? 'approved' : 'default'}>{user.active ? 'Aktif' : 'Nonaktif'}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => toggleUser(user.id)}
                            aria-label={`Toggle status ${user.name}`}
                            className={`w-10 h-[22px] rounded-full relative transition-colors cursor-pointer ${user.active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                          >
                            <span
                              className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${user.active ? 'left-[21px]' : 'left-[3px]'}`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-10 text-center text-gray-400 text-xs">
                          Tidak ada user yang cocok dengan pencarian
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Checklist Config */}
          {section === 'checklist' && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Konfigurasi Item Checklist</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Perubahan di sini akan memengaruhi checklist pada formulir pengajuan handover</p>
                </div>
                <div className="flex items-center gap-2">
                  <SearchBox value={search} onChange={setSearch} placeholder="Cari checklist..." />
                  <Button size="sm" onClick={openAdd}>
                    <Plus size={14} /> Tambah Item
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Item Checklist', 'Berlaku untuk Kritikalitas', 'Wajib', ''].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChecklist.map(ci => (
                      <tr key={ci.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-b-0">
                        <td className="px-3 py-2.5 text-gray-900 max-w-[360px]">
                          {ci.text}
                          {ci.category && ci.category.length > 0 && (
                            <div className="text-[11px] text-indigo-500 mt-0.5">Khusus kategori: {ci.category.join(', ')}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1 flex-wrap">
                            {ci.criticality.map(c => (
                              <Badge key={c} variant={critBadgeVariant(c)}>{c}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={ci.required ? 'rejected' : 'default'}>{ci.required ? 'Wajib' : 'Opsional'}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEdit(ci.id, { text: ci.text, criticality: ci.criticality.join(','), required: ci.required ? 'true' : 'false', category: (ci.category || []).join(',') })}
                              className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50"
                            >
                              <Pencil size={11} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(ci.id)}
                              className="inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 bg-red-50 rounded-md px-2 py-1 hover:bg-red-100"
                            >
                              <Trash2 size={11} /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredChecklist.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-gray-400 text-xs">
                          {search ? 'Tidak ada item yang cocok dengan pencarian' : 'Belum ada item checklist'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit modal — pakai komponen Modal bersama, bukan lagi markup manual */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={`${editId ? 'Edit' : 'Tambah'} Data`}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {section === 'pic' && (
            <>
              <Field label="Nama *" error={formErrors.name}>
                <input placeholder="Nama PIC" value={formData.name || ''} onChange={e => f('name', e.target.value)} className={inputCls(formErrors.name)} />
              </Field>
              <Field label="Email *" error={formErrors.email}>
                <input placeholder="Email" value={formData.email || ''} onChange={e => f('email', e.target.value)} className={inputCls(formErrors.email)} />
              </Field>
              <Field label="Departemen *" error={formErrors.department}>
                <input placeholder="Departemen" value={formData.department || ''} onChange={e => f('department', e.target.value)} className={inputCls(formErrors.department)} />
              </Field>
              <Field label="Telepon">
                <input placeholder="Telepon" value={formData.phone || ''} onChange={e => f('phone', e.target.value)} className={inputCls()} />
              </Field>
            </>
          )}
          {section === 'vendor' && (
            <>
              <Field label="Nama Vendor *" error={formErrors.name}>
                <input placeholder="Nama Vendor" value={formData.name || ''} onChange={e => f('name', e.target.value)} className={inputCls(formErrors.name)} />
              </Field>
              <Field label="Kategori *" error={formErrors.category}>
                <input placeholder="Kategori" value={formData.category || ''} onChange={e => f('category', e.target.value)} className={inputCls(formErrors.category)} />
              </Field>
              <Field label="Contact Person">
                <input placeholder="Contact Person" value={formData.contact || ''} onChange={e => f('contact', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Email" error={formErrors.email}>
                <input placeholder="Email" value={formData.email || ''} onChange={e => f('email', e.target.value)} className={inputCls(formErrors.email)} />
              </Field>
            </>
          )}
          {section === 'environment' && (
            <>
              <Field label="Nama Environment *" error={formErrors.name}>
                <input placeholder="Nama Environment" value={formData.name || ''} onChange={e => f('name', e.target.value)} className={inputCls(formErrors.name)} />
              </Field>
              <Field label="Deskripsi">
                <input placeholder="Deskripsi" value={formData.description || ''} onChange={e => f('description', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Server / Host">
                <input placeholder="Server / Host" value={formData.server || ''} onChange={e => f('server', e.target.value)} className={inputCls()} />
              </Field>
            </>
          )}
          {section === 'checklist' && (
            <>
              <Field label="Teks Item Checklist *" error={formErrors.text}>
                <textarea placeholder="Teks item checklist" value={formData.text || ''} onChange={e => f('text', e.target.value)} rows={3} className={`${inputCls(formErrors.text)} resize-y`} />
              </Field>
              <Field label="Berlaku untuk Kritikalitas (pilih beberapa) *" error={formErrors.criticality}>
                <div className="flex gap-3 flex-wrap mt-1">
                  {CRIT_OPTIONS.map(c => {
                    const current = (formData.criticality || '').split(',').filter(Boolean)
                    const checked = current.includes(c)
                    return (
                      <label key={c} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const updated = e.target.checked ? [...current, c] : current.filter(x => x !== c)
                            f('criticality', updated.join(','))
                          }}
                          className="accent-indigo-600"
                        />
                        {c}
                      </label>
                    )
                  })}
                </div>
              </Field>
              <Field label="Wajib">
                <select value={formData.required || 'true'} onChange={e => f('required', e.target.value)} className={inputCls()}>
                  <option value="true">Wajib</option>
                  <option value="false">Opsional</option>
                </select>
              </Field>
              <Field label="Batasi ke Kategori Aplikasi tertentu (opsional)">
                <div className="flex gap-x-3 gap-y-1.5 flex-wrap mt-1 max-h-32 overflow-y-auto pr-1">
                  {APPLICATION_CATEGORIES.map(cat => {
                    const current = (formData.category || '').split(',').filter(Boolean)
                    const checked = current.includes(cat)
                    return (
                      <label key={cat} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const updated = e.target.checked ? [...current, cat] : current.filter(x => x !== cat)
                            f('category', updated.join(','))
                          }}
                          className="accent-indigo-600"
                        />
                        {cat}
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Kosongkan supaya item ini berlaku untuk SEMUA kategori aplikasi (sesuai kritikalitasnya). Kalau dicentang, item cuma muncul untuk aplikasi dengan Kategori Aplikasi yang cocok.
                </p>
              </Field>
            </>
          )}
        </div>
      </Modal>

      {/* Delete confirm — pakai ConfirmModal bersama */}
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Hapus Data?"
        description="Data yang dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  )
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-colors w-44 sm:w-52"
      />
    </div>
  )
}

interface TableRow {
  id: string
  cells: string[]
  data: Record<string, string>
}

function TableSection({
  title, onAdd, cols, rows, onEdit, onDelete, search, onSearchChange, searchPlaceholder,
}: {
  title: string
  onAdd: () => void
  cols: string[]
  rows: TableRow[]
  onEdit: (id: string, data: Record<string, string>) => void
  onDelete: (id: string) => void
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <SearchBox value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
          <Button size="sm" onClick={onAdd}>
            <Plus size={14} /> Tambah
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {cols.map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 px-3 py-2.5">{h}</th>
              ))}
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-b-0">
                {row.cells.map((cell, i) => (
                  <td key={i} className={`px-3 py-2.5 text-sm ${i === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{cell}</td>
                ))}
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5">
                    <button onClick={() => onEdit(row.id, row.data)} className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50">
                      <Pencil size={11} /> Edit
                    </button>
                    <button onClick={() => onDelete(row.id)} className="inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 bg-red-50 rounded-md px-2 py-1 hover:bg-red-100">
                      <Trash2 size={11} /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} className="px-3 py-10 text-center text-gray-400 text-xs">
                  {search ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
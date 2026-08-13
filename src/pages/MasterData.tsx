import { useState } from 'react'
import type { AppState, MasterPIC, MasterVendor, MasterEnvironment, User, ChecklistItem, Criticality } from '../types'

interface Props {
  appState: AppState
  onUpdateState: (updates: Partial<AppState>) => void
}

type Section = 'pic' | 'vendor' | 'environment' | 'users' | 'checklist'

export default function MasterData({ appState, onUpdateState }: Props) {
  const [section, setSection] = useState<Section>('pic')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const SECTIONS: { id: Section; label: string }[] = [
    { id: 'pic', label: 'Master PIC' },
    { id: 'vendor', label: 'Master Vendor' },
    { id: 'environment', label: 'Environment' },
    { id: 'users', label: 'Role & Akses' },
    { id: 'checklist', label: 'Konfigurasi Checklist' },
  ]

  function openAdd() {
    setEditId(null)
    setFormData({})
    setShowModal(true)
  }

  function openEdit(id: string, data: Record<string, string>) {
    setEditId(id)
    setFormData(data)
    setShowModal(true)
  }

  function confirmDelete(id: string) {
    setDeleteConfirm(id)
  }

  function handleSavePIC() {
    const item: MasterPIC = {
      id: editId || `p-${Date.now()}`,
      name: formData.name || '',
      email: formData.email || '',
      department: formData.department || '',
      phone: formData.phone || '',
    }
    const list = editId
      ? appState.picList.map(p => p.id === editId ? item : p)
      : [...appState.picList, item]
    onUpdateState({ picList: list })
    setShowModal(false)
  }

  function handleSaveVendor() {
    const item: MasterVendor = {
      id: editId || `v-${Date.now()}`,
      name: formData.name || '',
      contact: formData.contact || '',
      email: formData.email || '',
      category: formData.category || '',
    }
    const list = editId
      ? appState.vendors.map(v => v.id === editId ? item : v)
      : [...appState.vendors, item]
    onUpdateState({ vendors: list })
    setShowModal(false)
  }

  function handleSaveEnv() {
    const item: MasterEnvironment = {
      id: editId || `e-${Date.now()}`,
      name: formData.name || '',
      description: formData.description || '',
      server: formData.server || '',
    }
    const list = editId
      ? appState.environments.map(e => e.id === editId ? item : e)
      : [...appState.environments, item]
    onUpdateState({ environments: list })
    setShowModal(false)
  }

  function handleSaveChecklist() {
    const item: ChecklistItem = {
      id: editId || `cl-${Date.now()}`,
      text: formData.text || '',
      criticality: (formData.criticality || 'Critical,High,Medium,Low').split(',') as Criticality[],
      required: formData.required === 'true',
    }
    const list = editId
      ? appState.checklistItems.map(c => c.id === editId ? item : c)
      : [...appState.checklistItems, item]
    onUpdateState({ checklistItems: list })
    setShowModal(false)
  }

  function handleSave() {
    if (section === 'pic') handleSavePIC()
    else if (section === 'vendor') handleSaveVendor()
    else if (section === 'environment') handleSaveEnv()
    else if (section === 'checklist') handleSaveChecklist()
  }

  function handleDelete(id: string) {
    if (section === 'pic') onUpdateState({ picList: appState.picList.filter(p => p.id !== id) })
    else if (section === 'vendor') onUpdateState({ vendors: appState.vendors.filter(v => v.id !== id) })
    else if (section === 'environment') onUpdateState({ environments: appState.environments.filter(e => e.id !== id) })
    else if (section === 'checklist') onUpdateState({ checklistItems: appState.checklistItems.filter(c => c.id !== id) })
    setDeleteConfirm(null)
  }

  function toggleUser(userId: string) {
    onUpdateState({ users: appState.users.map(u => u.id === userId ? { ...u, active: !u.active } : u) })
  }

  const inputSt: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const f = (k: string, v: string) => setFormData(prev => ({ ...prev, [k]: v }))

  const CRIT_OPTIONS: Criticality[] = ['Critical', 'High', 'Medium', 'Low']

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1a2332' }}>Master Data & Konfigurasi</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Kelola data referensi dan konfigurasi sistem AHMS</p>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 0, background: 'white', borderRadius: '10px 10px 0 0', border: '1px solid #e8edf3', borderBottom: 'none', overflow: 'hidden' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '11px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: section === s.id ? 600 : 400,
            borderBottom: `2px solid ${section === s.id ? '#2563EB' : 'transparent'}`,
            color: section === s.id ? '#2563EB' : '#6b7280', background: section === s.id ? '#eff6ff' : 'white',
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e8edf3', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 20 }}>
        {/* PIC */}
        {section === 'pic' && (
          <TableSection
            title="Daftar PIC"
            onAdd={openAdd}
            cols={['Nama', 'Departemen', 'Email', 'Telepon', '']}
            rows={appState.picList.map(p => ({
              id: p.id,
              cells: [p.name, p.department, p.email, p.phone],
              data: { name: p.name, email: p.email, department: p.department, phone: p.phone },
            }))}
            onEdit={openEdit}
            onDelete={confirmDelete}
          />
        )}

        {/* Vendor */}
        {section === 'vendor' && (
          <TableSection
            title="Daftar Vendor"
            onAdd={openAdd}
            cols={['Nama Vendor', 'Kategori', 'Contact Person', 'Email', '']}
            rows={appState.vendors.map(v => ({
              id: v.id,
              cells: [v.name, v.category, v.contact, v.email],
              data: { name: v.name, contact: v.contact, email: v.email, category: v.category },
            }))}
            onEdit={openEdit}
            onDelete={confirmDelete}
          />
        )}

        {/* Environment */}
        {section === 'environment' && (
          <TableSection
            title="Daftar Environment"
            onAdd={openAdd}
            cols={['Nama', 'Deskripsi', 'Server', '']}
            rows={appState.environments.map(e => ({
              id: e.id,
              cells: [e.name, e.description, e.server],
              data: { name: e.name, description: e.description, server: e.server },
            }))}
            onEdit={openEdit}
            onDelete={confirmDelete}
          />
        )}

        {/* Users */}
        {section === 'users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>User & Akses</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf3' }}>
                  {['Nama', 'Role', 'Email', 'Status', 'Toggle'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appState.users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: '#1a2332' }}>{user.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151' }}>{user.role}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{user.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: user.active ? '#f0fdf4' : '#f3f4f6', color: user.active ? '#16A34A' : '#6b7280' }}>
                        {user.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div
                        onClick={() => toggleUser(user.id)}
                        style={{
                          width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
                          background: user.active ? '#2563EB' : '#d1d5db', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: 'white',
                          top: 3, left: user.active ? 21 : 3, transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Checklist Config */}
        {section === 'checklist' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>Konfigurasi Item Checklist</h3>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Perubahan di sini akan memengaruhi checklist pada formulir pengajuan handover</p>
              </div>
              <button onClick={openAdd} style={{ padding: '8px 14px', borderRadius: 7, background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Tambah Item
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf3' }}>
                  {['Item Checklist', 'Berlaku untuk Kritikalitas', 'Wajib', ''].map(h => (
                    <th key={h} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appState.checklistItems.map(ci => (
                  <tr key={ci.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#1a2332', maxWidth: 360 }}>{ci.text}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {ci.criticality.map(c => (
                          <span key={c} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: c === 'Critical' ? '#fef2f2' : c === 'High' ? '#fefce8' : c === 'Medium' ? '#eff6ff' : '#f3f4f6', color: c === 'Critical' ? '#dc2626' : c === 'High' ? '#d97706' : c === 'Medium' ? '#2563EB' : '#6b7280' }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: ci.required ? '#16A34A' : '#6b7280' }}>
                        {ci.required ? 'Wajib' : 'Opsional'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(ci.id, { text: ci.text, criticality: ci.criticality.join(','), required: ci.required ? 'true' : 'false' })} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151' }}>Edit</button>
                        <button onClick={() => confirmDelete(ci.id)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', margin: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{editId ? 'Edit' : 'Tambah'} Data</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {section === 'pic' && <>
                <input placeholder="Nama" value={formData.name || ''} onChange={e => f('name', e.target.value)} style={inputSt} />
                <input placeholder="Email" value={formData.email || ''} onChange={e => f('email', e.target.value)} style={inputSt} />
                <input placeholder="Departemen" value={formData.department || ''} onChange={e => f('department', e.target.value)} style={inputSt} />
                <input placeholder="Telepon" value={formData.phone || ''} onChange={e => f('phone', e.target.value)} style={inputSt} />
              </>}
              {section === 'vendor' && <>
                <input placeholder="Nama Vendor" value={formData.name || ''} onChange={e => f('name', e.target.value)} style={inputSt} />
                <input placeholder="Kategori" value={formData.category || ''} onChange={e => f('category', e.target.value)} style={inputSt} />
                <input placeholder="Contact Person" value={formData.contact || ''} onChange={e => f('contact', e.target.value)} style={inputSt} />
                <input placeholder="Email" value={formData.email || ''} onChange={e => f('email', e.target.value)} style={inputSt} />
              </>}
              {section === 'environment' && <>
                <input placeholder="Nama Environment" value={formData.name || ''} onChange={e => f('name', e.target.value)} style={inputSt} />
                <input placeholder="Deskripsi" value={formData.description || ''} onChange={e => f('description', e.target.value)} style={inputSt} />
                <input placeholder="Server / Host" value={formData.server || ''} onChange={e => f('server', e.target.value)} style={inputSt} />
              </>}
              {section === 'checklist' && <>
                <textarea placeholder="Teks item checklist" value={formData.text || ''} onChange={e => f('text', e.target.value)} rows={3} style={{ ...inputSt, resize: 'vertical' }} />
                <div>
                  <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 6 }}>Berlaku untuk Kritikalitas (pilih beberapa):</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CRIT_OPTIONS.map(c => {
                      const current = (formData.criticality || '').split(',').filter(Boolean)
                      const checked = current.includes(c)
                      return (
                        <label key={c} style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" checked={checked} onChange={e => {
                            const updated = e.target.checked ? [...current, c] : current.filter(x => x !== c)
                            f('criticality', updated.join(','))
                          }} />
                          {c}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 6 }}>Wajib:</label>
                  <select value={formData.required || 'true'} onChange={e => f('required', e.target.value)} style={inputSt}>
                    <option value="true">Wajib</option>
                    <option value="false">Opsional</option>
                  </select>
                </div>
              </>}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13 }}>Batal</button>
              <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#2563EB', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%', margin: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Hapus Data?</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Data yang dihapus tidak dapat dikembalikan.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13 }}>Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TableRow {
  id: string
  cells: string[]
  data: Record<string, string>
}

function TableSection({
  title, onAdd, cols, rows, onEdit, onDelete,
}: {
  title: string
  onAdd: () => void
  cols: string[]
  rows: TableRow[]
  onEdit: (id: string, data: Record<string, string>) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h3>
        <button onClick={onAdd} style={{ padding: '8px 14px', borderRadius: 7, background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Tambah
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf3' }}>
            {cols.map(h => (
              <th key={h} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              {row.cells.map((cell, i) => (
                <td key={i} style={{ padding: '10px 12px', fontSize: 13, color: i === 0 ? '#1a2332' : '#374151', fontWeight: i === 0 ? 500 : 400 }}>{cell}</td>
              ))}
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onEdit(row.id, row.data)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151' }}>Edit</button>
                  <button onClick={() => onDelete(row.id)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>Hapus</button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={cols.length} style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Belum ada data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

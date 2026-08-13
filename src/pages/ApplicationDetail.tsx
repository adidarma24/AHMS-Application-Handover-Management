import { useState } from 'react'
import type { AppState, Application, Role } from '../types'
import type { Page } from '../App'
import { getStatusBadgeClass } from '../data'

interface Props {
  app: Application
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
  onUpdateApp: (id: string, updates: Partial<Application>) => void
}

type Tab = 'overview' | 'documents' | 'action-items' | 'history'

export default function ApplicationDetail({ app, currentUser, onNavigate, onUpdateApp }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [showEscModal, setShowEscModal] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(true)
  const [newActionTitle, setNewActionTitle] = useState('')

  const overdueCount = app.actionItems.filter(a => a.status === 'overdue').length
  const daysSinceSubmit = Math.floor((Date.now() - new Date(app.submittedDate).getTime()) / (1000 * 60 * 60 * 24))
  const rejectedReviewers = app.reviewers.filter(r => r.status === 'rejected')

  const riskLevel = app.riskScore >= 70 ? 'Tinggi' : app.riskScore >= 40 ? 'Sedang' : 'Rendah'
  const riskColor = app.riskScore >= 70 ? '#dc2626' : app.riskScore >= 40 ? '#d97706' : '#16A34A'
  const riskBg = app.riskScore >= 70 ? '#fef2f2' : app.riskScore >= 40 ? '#fefce8' : '#f0fdf4'

  const critColor: Record<string, string> = {
    Critical: '#dc2626', High: '#d97706', Medium: '#2563EB', Low: '#6b7280',
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Dokumen (${app.documents.length})` },
    { id: 'action-items', label: `Action Items (${app.actionItems.length})` },
    { id: 'history', label: 'Riwayat / Audit Trail' },
  ]

  function addActionItem() {
    if (!newActionTitle.trim()) return
    const updated = [...app.actionItems, {
      id: `ai-${Date.now()}`,
      title: newActionTitle,
      assignee: app.pic,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'open' as const,
      priority: 'medium' as const,
    }]
    onUpdateApp(app.id, { actionItems: updated })
    setNewActionTitle('')
  }

  function toggleActionStatus(aiId: string) {
    const updated = app.actionItems.map(ai =>
      ai.id === aiId ? { ...ai, status: ai.status === 'completed' ? 'open' as const : 'completed' as const } : ai
    )
    onUpdateApp(app.id, { actionItems: updated })
  }

  const aiInsightReasons: string[] = []
  if (overdueCount > 0) aiInsightReasons.push(`${overdueCount} action item overdue`)
  if (rejectedReviewers.length > 0) aiInsightReasons.push(`ditolak oleh ${rejectedReviewers.map(r => r.role).join(', ')}`)
  if (daysSinceSubmit > 60) aiInsightReasons.push(`sudah ${daysSinceSubmit} hari sejak pengajuan`)
  if (app.criticality === 'Critical') aiInsightReasons.push(`kritikalitas Critical`)
  if (!app.documents.every(d => d.uploaded)) aiInsightReasons.push(`dokumen wajib belum lengkap`)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <button
        onClick={() => onNavigate('my-applications')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 13, marginBottom: 16, padding: 0 }}
      >
        ← Kembali ke daftar aplikasi
      </button>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8edf3', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#1a2332' }}>{app.name}</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{app.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span className={`badge ${getStatusBadgeClass(app.status)}`} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {app.status}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: critColor[app.criticality], padding: '4px 10px', background: `${critColor[app.criticality]}15`, borderRadius: 20 }}>
              {app.criticality}
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            ['PIC', app.pic],
            ['Business Owner', app.businessOwner],
            ['Target Go-Live', app.goLiveDate],
            ['Diajukan', app.submittedDate],
            ['Teknologi', app.technology],
            ['Environment', app.environment],
            ['Vendor', app.vendor],
            ['Kategori', app.category],
          ].map(([label, value]) => (
            <div key={label as string} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label as string}</div>
              <div style={{ fontSize: 12, color: '#1a2332', fontWeight: 500, marginTop: 2 }}>{value as string}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Main content */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 0, background: 'white', borderRadius: '10px 10px 0 0', border: '1px solid #e8edf3', borderBottom: 'none', overflow: 'hidden' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '12px 18px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                  borderBottom: `2px solid ${tab === t.id ? '#2563EB' : 'transparent'}`,
                  color: tab === t.id ? '#2563EB' : '#6b7280', background: tab === t.id ? '#eff6ff' : 'white',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: 'white', border: '1px solid #e8edf3', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 20 }}>
            {/* Overview */}
            {tab === 'overview' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: '#1a2332' }}>Status Reviewer</h3>
                {app.reviewers.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Belum ada reviewer (status Draft)</p>
                ) : app.reviewers.map(r => (
                  <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>
                      {r.status === 'approved' || r.status === 'approved_with_condition' ? '✅' : r.status === 'rejected' ? '❌' : '⏳'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2332' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{r.role}</div>
                      {r.notes && <div style={{ fontSize: 11, color: '#d97706', marginTop: 2, fontStyle: 'italic' }}>{r.notes}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: r.status === 'approved' || r.status === 'approved_with_condition' ? '#16A34A' : r.status === 'rejected' ? '#dc2626' : '#d97706' }}>
                        {r.status === 'approved' ? 'Approved' : r.status === 'approved_with_condition' ? 'Approved w/ Condition' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                      {r.reviewedAt && <div style={{ fontSize: 10, color: '#9ca3af' }}>{r.reviewedAt}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documents */}
            {tab === 'documents' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: '#1a2332' }}>Dokumen Handover</h3>
                {app.documents.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Belum ada dokumen</p>
                ) : app.documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #e8edf3', borderRadius: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2332' }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{doc.type} {doc.uploadedAt && `• Uploaded ${doc.uploadedAt}`}</div>
                    </div>
                    {doc.required && <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>WAJIB</span>}
                    <span style={{ fontSize: 12, fontWeight: 600, color: doc.uploaded ? '#16A34A' : '#dc2626' }}>
                      {doc.uploaded ? '✓ Ada' : '✗ Belum'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Items */}
            {tab === 'action-items' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    value={newActionTitle}
                    onChange={e => setNewActionTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addActionItem()}
                    placeholder="Tambah action item baru..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
                  />
                  <button onClick={addActionItem} style={{ padding: '8px 14px', borderRadius: 7, background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Tambah</button>
                </div>
                {app.actionItems.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20 }}>Belum ada action item</p>
                ) : app.actionItems.map(ai => (
                  <div key={ai.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    border: `1px solid ${ai.status === 'overdue' ? '#fecaca' : '#e8edf3'}`,
                    background: ai.status === 'overdue' ? '#fef2f2' : ai.status === 'completed' ? '#f0fdf4' : 'white',
                    borderRadius: 8, marginBottom: 8,
                  }}>
                    <input type="checkbox" checked={ai.status === 'completed'} onChange={() => toggleActionStatus(ai.id)} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#1a2332', textDecoration: ai.status === 'completed' ? 'line-through' : 'none', opacity: ai.status === 'completed' ? 0.6 : 1 }}>{ai.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{ai.assignee} • Due: {ai.dueDate}</div>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
                      background: ai.status === 'overdue' ? '#fef2f2' : ai.status === 'completed' ? '#f0fdf4' : '#f3f4f6',
                      color: ai.status === 'overdue' ? '#dc2626' : ai.status === 'completed' ? '#16A34A' : '#6b7280',
                    }}>
                      {ai.status === 'overdue' ? 'OVERDUE' : ai.status === 'completed' ? 'DONE' : 'OPEN'}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600, background: ai.priority === 'high' ? '#fef2f2' : '#fefce8', color: ai.priority === 'high' ? '#dc2626' : '#d97706' }}>
                      {ai.priority.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* History */}
            {tab === 'history' && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px', color: '#1a2332' }}>Audit Trail</h3>
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: '#e8edf3' }} />
                  {[...app.history].reverse().map((h, i) => (
                    <div key={h.id} style={{ position: 'relative', marginBottom: 16 }}>
                      <div style={{ position: 'absolute', left: -20, width: 10, height: 10, borderRadius: '50%', background: '#2563EB', border: '2px solid white', top: 3 }} />
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{h.timestamp}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2332' }}>{h.action}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>oleh {h.user}</div>
                      {h.notes && <div style={{ fontSize: 12, color: '#d97706', marginTop: 3, fontStyle: 'italic' }}>"{h.notes}"</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: AI Risk */}
        <div>
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e8edf3', overflow: 'hidden', marginBottom: 12 }}>
            <div
              style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: riskBg }}
              onClick={() => setAiExpanded(e => !e)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🤖</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2332' }}>AI Risk Insight</span>
              </div>
              <span style={{ fontSize: 11 }}>{aiExpanded ? '▲' : '▼'}</span>
            </div>
            {aiExpanded && (
              <div style={{ padding: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 8px',
                    background: `conic-gradient(${riskColor} ${app.riskScore * 3.6}deg, #e8edf3 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: riskColor }}>{app.riskScore}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: riskColor }}>Risiko {riskLevel}</div>
                </div>
                {aiInsightReasons.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faktor Risiko</div>
                    {aiInsightReasons.map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#374151', padding: '4px 0', display: 'flex', gap: 6 }}>
                        <span style={{ color: riskColor, flexShrink: 0 }}>•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#16A34A', textAlign: 'center' }}>Tidak ada faktor risiko teridentifikasi</p>
                )}
              </div>
            )}
          </div>

          {/* Escalation */}
          {app.riskScore >= 50 && (
            <button
              onClick={() => setShowEscModal(true)}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, background: '#fef2f2',
                border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              ✉ Generate Draft Eskalasi
            </button>
          )}
        </div>
      </div>

      {/* Escalation Modal */}
      {showEscModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 560, width: '100%', margin: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Draft Email Eskalasi</h3>
              <button onClick={() => setShowEscModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
{`Kepada: Manager Divisi IT & O&M
Cc: ${app.businessOwner}, ${app.pic}
Subjek: [ESKALASI] Hambatan Proses Handover — ${app.name}

Yth. Bapak/Ibu Manager,

Dengan hormat, kami sampaikan bahwa proses handover aplikasi berikut memerlukan perhatian segera:

Aplikasi  : ${app.name}
PIC       : ${app.pic}
Status    : ${app.status}
Diajukan  : ${app.submittedDate} (${daysSinceSubmit} hari lalu)
Kritikalitas: ${app.criticality}

KONDISI SAAT INI:
${aiInsightReasons.map(r => `• ${r.charAt(0).toUpperCase() + r.slice(1)}`).join('\n') || '• Proses review berjalan lambat'}

Kami memohon intervensi dan keputusan dalam waktu 3 hari kerja untuk memastikan jadwal go-live ${app.goLiveDate} dapat terpenuhi.

Hormat kami,
${currentUser.name}
${currentUser.role}
PT Energi Nusantara Persada`}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEscModal(false)} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13 }}>Tutup</button>
              <button
                onClick={() => { navigator.clipboard?.writeText('Draft disalin!'); setShowEscModal(false) }}
                style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#2563EB', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Salin Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

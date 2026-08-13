import { useState } from 'react'
import type { AppState, Application, ReviewDecision, Role } from '../types'
import type { Page } from '../App'
import { getStatusBadgeClass } from '../data'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page, appId?: string) => void
  onUpdateApp: (id: string, updates: Partial<Application>) => void
}

export default function Review({ appState, currentUser, onNavigate, onUpdateApp }: Props) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [decision, setDecision] = useState<ReviewDecision | null>(null)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isManagerOM = currentUser.role === 'Manager O&M'

  const reviewableApps = appState.applications.filter(app => {
    if (isManagerOM) {
      return app.status === 'Approved' || app.status === 'Under Technical Review' || app.status === 'Waiting for O&M Review'
    }
    const reviewer = app.reviewers.find(r => r.role === currentUser.role)
    return reviewer && reviewer.status === 'pending' &&
      (app.status === 'Waiting for O&M Review' || app.status === 'Under Technical Review')
  })

  const selectedApp = selectedAppId ? appState.applications.find(a => a.id === selectedAppId) : null

  function allReviewersApproved(app: Application) {
    return app.reviewers.length > 0 && app.reviewers.every(r => r.status === 'approved' || r.status === 'approved_with_condition')
  }

  function canFinalApprove(app: Application) {
    return allReviewersApproved(app) && app.actionItems.every(ai => ai.status !== 'overdue')
  }

  function handleSubmitReview() {
    if (!selectedApp || !decision) return
    if (decision === 'rejected' && !notes.trim()) return

    const now = new Date().toISOString().slice(0, 10)
    const updatedReviewers = selectedApp.reviewers.map(r =>
      r.role === currentUser.role
        ? { ...r, status: decision, notes: notes || undefined, reviewedAt: now, name: currentUser.name }
        : r
    )

    const allDone = updatedReviewers.every(r => r.status !== 'pending')
    const anyRejected = updatedReviewers.some(r => r.status === 'rejected')

    let newStatus = selectedApp.status
    if (allDone && anyRejected) newStatus = 'Rejected'
    else if (allDone && !anyRejected) newStatus = 'Approved'
    else if (decision !== 'rejected') newStatus = 'Under Technical Review'

    const newHistory = [
      ...selectedApp.history,
      {
        id: `h-${Date.now()}`,
        timestamp: `${now} ${new Date().toTimeString().slice(0, 5)}`,
        user: currentUser.name,
        action: `Review ${currentUser.role}: ${decision === 'approved' ? 'Disetujui' : decision === 'approved_with_condition' ? 'Disetujui dengan Kondisi' : 'Ditolak'}`,
        notes: notes || undefined,
      },
    ]

    onUpdateApp(selectedApp.id, { reviewers: updatedReviewers, status: newStatus, history: newHistory })
    setSubmitted(true)
  }

  function handleFinalApprove(app: Application) {
    const now = new Date().toISOString().slice(0, 10)
    onUpdateApp(app.id, {
      status: 'Handover Accepted',
      history: [...app.history, {
        id: `h-${Date.now()}`,
        timestamp: `${now} ${new Date().toTimeString().slice(0, 5)}`,
        user: currentUser.name,
        action: 'Final Approval diberikan — Status: Handover Accepted',
      }],
    })
    setSelectedAppId(null)
  }

  const critColor: Record<string, string> = {
    Critical: '#dc2626', High: '#d97706', Medium: '#2563EB', Low: '#6b7280',
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>
          {decision === 'approved' ? '✅' : decision === 'approved_with_condition' ? '⚠️' : '❌'}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', margin: '0 0 8px' }}>Review Tersubmit</h2>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>
          Keputusan Anda telah disimpan untuk aplikasi <strong>{selectedApp?.name}</strong>
        </p>
        <button
          onClick={() => { setSubmitted(false); setSelectedAppId(null); setDecision(null); setNotes('') }}
          style={{ padding: '10px 20px', borderRadius: 8, background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          Kembali ke Daftar Review
        </button>
      </div>
    )
  }

  if (selectedApp && !isManagerOM) {
    const myReview = selectedApp.reviewers.find(r => r.role === currentUser.role)
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => { setSelectedAppId(null); setDecision(null); setNotes('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 13, marginBottom: 16, padding: 0 }}>
          ← Kembali ke daftar review
        </button>

        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8edf3', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#1a2332' }}>{selectedApp.name}</h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{selectedApp.description}</p>
            </div>
            <span className={`badge ${getStatusBadgeClass(selectedApp.status)}`} style={{ padding: '4px 10px', borderRadius: 10, fontSize: 12 }}>{selectedApp.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['Kritikalitas', <span style={{ fontWeight: 600, color: critColor[selectedApp.criticality] }}>{selectedApp.criticality}</span>],
              ['PIC Project', selectedApp.pic],
              ['PIC O&M', selectedApp.picOM],
              ['Business Owner', selectedApp.businessOwner],
              ['Go-Live', selectedApp.goLiveDate],
              ['Teknologi', selectedApp.technology],
              ['Environment', selectedApp.environment],
            ].map(([label, value], i) => (
              <div key={i} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{label as string}</div>
                <div style={{ fontSize: 13, color: '#1a2332', marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dokumen */}
        <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #e8edf3', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#1a2332' }}>Dokumen Tersedia</h3>
          {selectedApp.documents.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Belum ada dokumen yang diunggah</p>
          ) : selectedApp.documents.map(doc => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: doc.uploaded ? '#16A34A' : '#dc2626' }}>{doc.uploaded ? '✓' : '✗'}</span>
              <span style={{ fontSize: 13, color: '#374151' }}>{doc.name}</span>
              {doc.required && <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>WAJIB</span>}
              {doc.uploadedAt && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{doc.uploadedAt}</span>}
            </div>
          ))}
        </div>

        {/* Form Review */}
        <div style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #e8edf3' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: '#1a2332' }}>Form Review — {currentUser.role}</h3>

          {myReview?.status !== 'pending' ? (
            <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, color: '#16A34A', fontSize: 13 }}>
              ✓ Anda sudah memberikan review: <strong>{myReview?.status}</strong>
              {myReview?.notes && <p style={{ margin: '6px 0 0', color: '#374151' }}>Catatan: {myReview.notes}</p>}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {[
                  { key: 'approved', label: '✓ Approve', color: '#16A34A', bg: '#f0fdf4', border: '#bbf7d0' },
                  { key: 'approved_with_condition', label: '⚠ Approve with Condition', color: '#d97706', bg: '#fefce8', border: '#fde68a' },
                  { key: 'rejected', label: '✗ Reject', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setDecision(opt.key as ReviewDecision)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      border: `2px solid ${decision === opt.key ? opt.color : '#e5e7eb'}`,
                      background: decision === opt.key ? opt.bg : 'white',
                      color: decision === opt.key ? opt.color : '#6b7280',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {(decision === 'rejected' || decision === 'approved_with_condition') && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                    Catatan {decision === 'rejected' ? '(wajib)' : '(opsional)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Jelaskan alasan penolakan atau kondisi yang harus dipenuhi..."
                    rows={4}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <button
                onClick={handleSubmitReview}
                disabled={!decision || (decision === 'rejected' && !notes.trim())}
                style={{
                  width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                  background: !decision || (decision === 'rejected' && !notes.trim()) ? '#9ca3af' : '#2563EB',
                  color: 'white', cursor: !decision || (decision === 'rejected' && !notes.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Submit Review
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Manager O&M: Final Approval view
  if (isManagerOM && selectedApp) {
    const canApprove = canFinalApprove(selectedApp)
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => setSelectedAppId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 13, marginBottom: 16, padding: 0 }}>
          ← Kembali
        </button>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8edf3', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#1a2332' }}>{selectedApp.name}</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>{selectedApp.description}</p>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#1a2332' }}>Status Reviewer</h3>
          {selectedApp.reviewers.map(r => (
            <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>
                {r.status === 'approved' || r.status === 'approved_with_condition' ? '✅' : r.status === 'rejected' ? '❌' : '⏳'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2332' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{r.role}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: r.status === 'approved' || r.status === 'approved_with_condition' ? '#16A34A' : r.status === 'rejected' ? '#dc2626' : '#d97706' }}>
                {r.status === 'approved' ? 'Approved' : r.status === 'approved_with_condition' ? 'Approved w/ Condition' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
              </span>
            </div>
          ))}
          {selectedApp.actionItems.filter(a => a.status === 'overdue').length > 0 && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, marginTop: 12, fontSize: 13, color: '#dc2626' }}>
              ⚠ Ada {selectedApp.actionItems.filter(a => a.status === 'overdue').length} action item overdue yang belum diselesaikan
            </div>
          )}
          <button
            onClick={() => handleFinalApprove(selectedApp)}
            disabled={!canApprove}
            style={{
              width: '100%', marginTop: 20, padding: '12px', borderRadius: 8, border: 'none',
              background: canApprove ? '#16A34A' : '#9ca3af',
              color: 'white', cursor: canApprove ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
            }}
            title={!canApprove ? 'Semua reviewer harus approve dan tidak ada action item overdue' : ''}
          >
            {canApprove ? '✓ Final Approval — Handover Accepted' : '⊘ Final Approval (syarat belum terpenuhi)'}
          </button>
          {!canApprove && (
            <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
              Semua reviewer harus approve & tidak ada action item overdue
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1a2332' }}>
          {isManagerOM ? 'Final Approval' : 'Review & Approval'}
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          {reviewableApps.length} aplikasi memerlukan {isManagerOM ? 'final approval' : 'review Anda'}
        </p>
      </div>

      {reviewableApps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 10, border: '1px solid #e8edf3', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <p style={{ fontSize: 14 }}>Tidak ada aplikasi yang perlu di-review saat ini</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviewableApps.map(app => {
            const myReview = app.reviewers.find(r => r.role === currentUser.role)
            const canApprove = isManagerOM && canFinalApprove(app)
            return (
              <div
                key={app.id}
                style={{ background: 'white', borderRadius: 10, padding: 20, border: '1px solid #e8edf3', cursor: 'pointer' }}
                onClick={() => setSelectedAppId(app.id)}
                className="table-row"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#1a2332' }}>{app.name}</h3>
                      <span className={`badge ${getStatusBadgeClass(app.status)}`} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{app.status}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: critColor[app.criticality] }}>{app.criticality}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>{app.description.slice(0, 100)}...</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#374151' }}>
                      <span>PIC Project: {app.pic}</span>
                      <span>Go-Live: {app.goLiveDate}</span>
                      {app.actionItems.filter(a => a.status === 'overdue').length > 0 && (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠ {app.actionItems.filter(a => a.status === 'overdue').length} overdue</span>
                      )}
                    </div>
                    {isManagerOM && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        {app.reviewers.map(r => (
                          <span key={r.role} title={`${r.role}: ${r.status}`} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: r.status !== 'pending' ? '#f0fdf4' : '#fefce8', color: r.status !== 'pending' ? '#16A34A' : '#d97706' }}>
                            {r.status !== 'pending' ? '✓' : '⏳'} {r.role.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    {isManagerOM ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: canApprove ? '#16A34A' : '#d97706' }}>
                        {canApprove ? '✓ Siap final approval' : '⏳ Belum siap'}
                      </span>
                    ) : (
                      myReview && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: myReview.status === 'pending' ? '#d97706' : '#16A34A' }}>
                          {myReview.status === 'pending' ? 'Perlu review' : 'Sudah di-review'}
                        </span>
                      )
                    )}
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>→ Buka detail</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const critColor: Record<string, string> = {
  Critical: '#dc2626', High: '#d97706', Medium: '#2563EB', Low: '#6b7280',
}
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

const critColor: Record<string, string> = {
  Critical: '#dc2626', High: '#d97706', Medium: '#2563EB', Low: '#6b7280',
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

  // Sesuai use case: final approval baru bisa diberikan jika seluruh reviewer
  // approve DAN seluruh action item yang ditandai WAJIB sudah completed
  // (bukan sekadar "tidak overdue").
  function requiredActionItemsDone(app: Application) {
    return app.actionItems.filter(ai => ai.required).every(ai => ai.status === 'completed')
  }

  function canFinalApprove(app: Application) {
    return allReviewersApproved(app) && requiredActionItemsDone(app)
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

  // Final approval sekaligus men-generate Berita Acara Handover otomatis
  // (Kebutuhan Fungsional #13): nomor + tanggal terbit dicatat di data aplikasi,
  // dan tercatat di audit trail.
  function handleFinalApprove(app: Application) {
    const now = new Date().toISOString().slice(0, 10)
    const appNum = app.id.replace('app-', '')
    const beritaAcaraNumber = `BA-HO/${appNum}/${new Date().getFullYear()}`
    onUpdateApp(app.id, {
      status: 'Handover Accepted',
      beritaAcaraNumber,
      beritaAcaraGeneratedAt: now,
      history: [...app.history, {
        id: `h-${Date.now()}`,
        timestamp: `${now} ${new Date().toTimeString().slice(0, 5)}`,
        user: currentUser.name,
        action: 'Final Approval diberikan — Status: Handover Accepted',
      }, {
        id: `h-${Date.now() + 1}`,
        timestamp: `${now} ${new Date().toTimeString().slice(0, 5)}`,
        user: 'Sistem',
        action: `Berita Acara Handover No. ${beritaAcaraNumber} diterbitkan otomatis`,
      }],
    })
    setSelectedAppId(null)
  }

  if (submitted) {
    return (
      <div className="max-w-125 mx-auto mt-10 sm:mt-16 text-center px-4">
        <div className="text-5xl mb-4">
          {decision === 'approved' ? '✅' : decision === 'approved_with_condition' ? '⚠️' : '❌'}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Review Tersubmit</h2>
        <p className="text-gray-500 mb-5">
          Keputusan Anda telah disimpan untuk aplikasi <strong>{selectedApp?.name}</strong>
        </p>
        <button
          onClick={() => { setSubmitted(false); setSelectedAppId(null); setDecision(null); setNotes('') }}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white border-none cursor-pointer text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Kembali ke Daftar Review
        </button>
      </div>
    )
  }

  if (selectedApp && !isManagerOM) {
    const myReview = selectedApp.reviewers.find(r => r.role === currentUser.role)
    return (
      <div className="max-w-180 mx-auto">
        <button
          onClick={() => { setSelectedAppId(null); setDecision(null); setNotes('') }}
          className="bg-transparent border-none cursor-pointer text-indigo-600 text-sm mb-4 p-0"
        >
          ← Kembali ke daftar review
        </button>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedApp.name}</h2>
              <p className="text-[13px] text-gray-500">{selectedApp.description}</p>
            </div>
            <span
              className={`badge ${getStatusBadgeClass(selectedApp.status)} self-start shrink-0`}
              style={{ padding: '4px 10px', borderRadius: 10, fontSize: 12 }}
            >
              {selectedApp.status}
            </span>
          </div>
          {/* Grid info — 1 kolom di mobile, 2 di tablet, 3 di desktop.
              Sebelumnya dipaksa 3 kolom tetap (repeat(3, 1fr)) sehingga
              sangat sempit di layar HP. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ['Kritikalitas', <span key="c" style={{ fontWeight: 600, color: critColor[selectedApp.criticality] }}>{selectedApp.criticality}</span>],
              ['PIC Project', selectedApp.pic],
              ['PIC O&M', selectedApp.picOM],
              ['Business Owner', selectedApp.businessOwner],
              ['Go-Live', selectedApp.goLiveDate],
              ['Teknologi', selectedApp.technology],
              ['Environment', selectedApp.environment],
            ].map(([label, value], i) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-md min-w-0">
                <div className="text-[11px] text-gray-500 font-medium">{label as string}</div>
                <div className="text-[13px] text-gray-900 mt-0.5 wrap-break-word">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dokumen */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Dokumen Tersedia</h3>
          {selectedApp.documents.length === 0 ? (
            <p className="text-[13px] text-gray-400">Belum ada dokumen yang diunggah</p>
          ) : selectedApp.documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-2.5 flex-wrap py-1.5 border-b border-gray-100 last:border-b-0">
              <span className={doc.uploaded ? 'text-emerald-600' : 'text-red-600'}>{doc.uploaded ? '✓' : '✗'}</span>
              <span className="text-[13px] text-gray-700 min-w-0 wrap-break-word">{doc.name}</span>
              {doc.required && <span className="text-[10px] text-red-600 font-semibold">WAJIB</span>}
              {doc.uploadedAt && <span className="text-[11px] text-gray-400 sm:ml-auto">{doc.uploadedAt}</span>}
            </div>
          ))}
        </div>

        {/* Form Review */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Form Review — {currentUser.role}</h3>

          {myReview?.status !== 'pending' ? (
            <div className="p-4 bg-emerald-50 rounded-lg text-emerald-600 text-[13px]">
              ✓ Anda sudah memberikan review: <strong>{myReview?.status}</strong>
              {myReview?.notes && <p className="mt-1.5 text-gray-700">Catatan: {myReview.notes}</p>}
            </div>
          ) : (
            <>
              {/* Tombol keputusan — ditumpuk vertikal di mobile supaya teks
                  "Approve with Condition" tidak kepotong/overlap; jadi
                  sejajar lagi mulai breakpoint sm. */}
              <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
                {[
                  { key: 'approved', label: '✓ Approve', color: '#16A34A', bg: '#f0fdf4', border: '#bbf7d0' },
                  { key: 'approved_with_condition', label: '⚠ Approve with Condition', color: '#d97706', bg: '#fefce8', border: '#fde68a' },
                  { key: 'rejected', label: '✗ Reject', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setDecision(opt.key as ReviewDecision)}
                    className="sm:flex-1 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] font-semibold transition-all duration-150"
                    style={{
                      border: `2px solid ${decision === opt.key ? opt.color : '#e5e7eb'}`,
                      background: decision === opt.key ? opt.bg : 'white',
                      color: decision === opt.key ? opt.color : '#6b7280',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {(decision === 'rejected' || decision === 'approved_with_condition') && (
                <div className="mb-4">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Catatan {decision === 'rejected' ? '(wajib)' : '(opsional)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Jelaskan alasan penolakan atau kondisi yang harus dipenuhi..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-[13px] outline-none resize-y box-border"
                  />
                </div>
              )}

              <button
                onClick={handleSubmitReview}
                disabled={!decision || (decision === 'rejected' && !notes.trim())}
                className="w-full py-2.5 rounded-lg border-none text-white text-[13px] font-semibold"
                style={{
                  background: !decision || (decision === 'rejected' && !notes.trim()) ? '#9ca3af' : '#2563EB',
                  cursor: !decision || (decision === 'rejected' && !notes.trim()) ? 'not-allowed' : 'pointer',
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
      <div className="max-w-180 mx-auto">
        <button onClick={() => setSelectedAppId(null)} className="bg-transparent border-none cursor-pointer text-indigo-600 text-sm mb-4 p-0">
          ← Kembali
        </button>
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedApp.name}</h2>
          <p className="text-[13px] text-gray-500 mb-5">{selectedApp.description}</p>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Reviewer</h3>
          {selectedApp.reviewers.map(r => (
            <div key={r.role} className="flex items-center gap-3 flex-wrap px-3.5 py-2.5 bg-gray-50 rounded-lg mb-2">
              <span className="text-lg shrink-0">
                {r.status === 'approved' || r.status === 'approved_with_condition' ? '✅' : r.status === 'rejected' ? '❌' : '⏳'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900 truncate">{r.name}</div>
                <div className="text-[11px] text-gray-500">{r.role}</div>
              </div>
              <span
                className="text-xs font-semibold shrink-0"
                style={{ color: r.status === 'approved' || r.status === 'approved_with_condition' ? '#16A34A' : r.status === 'rejected' ? '#dc2626' : '#d97706' }}
              >
                {r.status === 'approved' ? 'Approved' : r.status === 'approved_with_condition' ? 'Approved w/ Condition' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
              </span>
            </div>
          ))}
          {selectedApp.actionItems.filter(a => a.required && a.status !== 'completed').length > 0 && (
            <div className="px-3.5 py-2.5 bg-red-50 rounded-lg mt-3 text-[13px] text-red-600">
              ⚠ Ada {selectedApp.actionItems.filter(a => a.required && a.status !== 'completed').length} action item WAJIB yang belum diselesaikan
            </div>
          )}
          <button
            onClick={() => handleFinalApprove(selectedApp)}
            disabled={!canApprove}
            className="w-full mt-5 py-3 rounded-lg border-none text-white text-sm font-bold transition-all duration-150"
            style={{
              background: canApprove ? '#16A34A' : '#9ca3af',
              cursor: canApprove ? 'pointer' : 'not-allowed',
            }}
            title={!canApprove ? 'Semua reviewer harus approve dan seluruh action item wajib harus completed' : ''}
          >
            {canApprove ? '✓ Final Approval — Handover Accepted' : '⊘ Final Approval (syarat belum terpenuhi)'}
          </button>
          {!canApprove && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Semua reviewer harus approve & seluruh action item wajib harus completed
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {isManagerOM ? 'Final Approval' : 'Review & Approval'}
        </h1>
        <p className="text-[13px] text-gray-500">
          {reviewableApps.length} aplikasi memerlukan {isManagerOM ? 'final approval' : 'review Anda'}
        </p>
      </div>

      {reviewableApps.length === 0 ? (
        <div className="text-center py-14 px-6 bg-white rounded-xl border border-gray-200 text-gray-400">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-sm">Tidak ada aplikasi yang perlu di-review saat ini</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviewableApps.map(app => {
            const myReview = app.reviewers.find(r => r.role === currentUser.role)
            const canApprove = isManagerOM && canFinalApprove(app)
            return (
              <div
                key={app.id}
                className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 cursor-pointer table-row"
                onClick={() => setSelectedAppId(app.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900">{app.name}</h3>
                      <span className={`badge ${getStatusBadgeClass(app.status)}`} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{app.status}</span>
                      <span className="text-[11px] font-semibold" style={{ color: critColor[app.criticality] }}>{app.criticality}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2.5">{app.description.slice(0, 100)}...</p>
                    <div className="flex gap-x-4 gap-y-1 flex-wrap text-xs text-gray-700">
                      <span>PIC Project: {app.pic}</span>
                      <span>Go-Live: {app.goLiveDate}</span>
                      {app.actionItems.filter(a => a.status === 'overdue').length > 0 && (
                        <span className="text-red-600 font-semibold">⚠ {app.actionItems.filter(a => a.status === 'overdue').length} overdue</span>
                      )}
                    </div>
                    {isManagerOM && (
                      <div className="flex gap-1.5 flex-wrap mt-2.5">
                        {app.reviewers.map(r => (
                          <span
                            key={r.role}
                            title={`${r.role}: ${r.status}`}
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ background: r.status !== 'pending' ? '#f0fdf4' : '#fefce8', color: r.status !== 'pending' ? '#16A34A' : '#d97706' }}
                          >
                            {r.status !== 'pending' ? '✓' : '⏳'} {r.role.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-2 shrink-0">
                    {isManagerOM ? (
                      <span className="text-xs font-semibold" style={{ color: canApprove ? '#16A34A' : '#d97706' }}>
                        {canApprove ? '✓ Siap final approval' : '⏳ Belum siap'}
                      </span>
                    ) : (
                      myReview && (
                        <span className="text-xs font-semibold" style={{ color: myReview.status === 'pending' ? '#d97706' : '#16A34A' }}>
                          {myReview.status === 'pending' ? 'Perlu review' : 'Sudah di-review'}
                        </span>
                      )
                    )}
                    <span className="text-xs text-gray-400">→ Buka detail</span>
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
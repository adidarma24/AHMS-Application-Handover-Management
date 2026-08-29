import { useState, useRef, useEffect } from 'react'
import type { AppState, Role } from '../types'
import type { Page } from '../App'
import { getEffectiveStatus } from '../lib/actionItemStatus'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role }
  onNavigate: (page: Page) => void
}

interface Message {
  role: 'user' | 'assistant'
  text: string
}

function processQuery(query: string, appState: AppState): string {
  const q = query.toLowerCase()
  const apps = appState.applications

  if (q.includes('overdue') || q.includes('terlambat')) {
    const overdueApps = apps.filter(a =>
      a.actionItems.some(ai => getEffectiveStatus(ai) === 'overdue')
    )
    if (overdueApps.length === 0) return 'Tidak ada aplikasi dengan action item overdue saat ini.'
    return `Ada ${overdueApps.length} aplikasi dengan action item overdue:\n\n` +
      overdueApps.map(a => {
        const items = a.actionItems.filter(ai => getEffectiveStatus(ai) === 'overdue')
        return `• **${a.name}** — ${items.length} item overdue (PIC: ${a.pic})`
      }).join('\n')
  }

  if (q.includes('risiko tinggi') || q.includes('high risk') || q.includes('berisiko')) {
    const high = apps.filter(a => a.riskScore >= 60)
    if (high.length === 0) return 'Tidak ada aplikasi dengan risiko tinggi (score ≥ 60) saat ini.'
    return `${high.length} aplikasi berisiko tinggi:\n\n` +
      high.sort((a, b) => b.riskScore - a.riskScore)
        .map(a => `• **${a.name}** — Skor: ${a.riskScore} | Status: ${a.status}`)
        .join('\n')
  }

  if (q.includes('ditolak') || q.includes('reject')) {
    const rejected = apps.filter(a => a.status === 'Rejected')
    if (rejected.length === 0) return 'Tidak ada aplikasi dengan status Rejected.'
    return `${rejected.length} aplikasi ditolak:\n\n` +
      rejected.map(a => `• **${a.name}** — PIC: ${a.pic}`).join('\n')
  }

  if (q.includes('menunggu') || q.includes('pending') || q.includes('waiting')) {
    const pending = apps.filter(a =>
      a.status === 'Waiting for O&M Review' || a.status === 'Under Technical Review'
    )
    return `${pending.length} aplikasi sedang dalam proses review:\n\n` +
      pending.map(a => `• **${a.name}** — ${a.status}`).join('\n')
  }

  if (q.includes('diterima') || q.includes('accepted') || q.includes('handover accepted')) {
    const done = apps.filter(a => a.status === 'Handover Accepted')
    return `${done.length} aplikasi sudah handover accepted:\n\n` +
      done.map(a => `• **${a.name}** (PIC: ${a.pic})`).join('\n')
  }

  if (q.includes('total') || q.includes('berapa') || q.includes('jumlah')) {
    const byStatus: Record<string, number> = {}
    apps.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1 })
    return `Total ${apps.length} aplikasi dalam sistem:\n\n` +
      Object.entries(byStatus).map(([s, n]) => `• ${s}: ${n}`).join('\n')
  }

  if (q.includes('critical')) {
    const crit = apps.filter(a => a.criticality === 'Critical')
    return `${crit.length} aplikasi dengan kritikalitas Critical:\n\n` +
      crit.map(a => `• **${a.name}** — Status: ${a.status}`).join('\n')
  }

  if (q.includes('draft')) {
    const drafts = apps.filter(a => a.status === 'Draft')
    return `${drafts.length} aplikasi berstatus Draft:\n\n` +
      drafts.map(a => `• **${a.name}** — PIC: ${a.pic}`).join('\n')
  }

  if (q.includes('approved') || q.includes('disetujui')) {
    const appr = apps.filter(a => a.status === 'Approved')
    return `${appr.length} aplikasi berstatus Approved (menunggu final acceptance):\n\n` +
      appr.map(a => `• **${a.name}** — PIC: ${a.pic}`).join('\n')
  }

  // Find by name
  const found = apps.find(a => a.name.toLowerCase().includes(q) || q.includes(a.name.toLowerCase()))
  if (found) {
    return `**${found.name}**\n` +
      `Status: ${found.status}\n` +
      `Kritikalitas: ${found.criticality}\n` +
      `PIC: ${found.pic}\n` +
      `Business Owner: ${found.businessOwner}\n` +
      `Skor Risiko: ${found.riskScore}\n` +
      `Action Items Overdue: ${found.actionItems.filter(a => getEffectiveStatus(a) === 'overdue').length}`
  }

  return `Maaf, saya tidak menemukan informasi yang sesuai. Coba tanyakan:\n` +
    `• "Aplikasi apa yang overdue?"\n` +
    `• "Berapa total aplikasi?"\n` +
    `• "Aplikasi berisiko tinggi"\n` +
    `• "Aplikasi yang ditolak"\n` +
    `• Nama aplikasi spesifik`
}

export default function AIAssistant({ appState, currentUser }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Halo ${currentUser.name}! Saya asisten AHMS. Tanya saya tentang status aplikasi, action item, atau statistik handover.` },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim() || thinking) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setThinking(true)
    setTimeout(() => {
      const reply = processQuery(userMsg, appState)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      setThinking(false)
    }, 600)
  }

  return (
    <>
      {/* Floating button — di mobile digeser ke atas bottom nav (yang juga fixed
          di posisi bawah) supaya tidak menutupi tab paling kanan (Profil).
          Di layar >=lg (tidak ada bottom nav), posisinya balik seperti semula. */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed z-[1000] w-[52px] h-[52px] rounded-full border-none cursor-pointer flex items-center justify-center text-white text-[22px] transition-transform duration-200 right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6 print:hidden"
        style={{
          background: 'linear-gradient(135deg, #1B3A6B, #2563EB)',
          boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
        }}
        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel — di mobile melebar penuh (dikurangi margin kiri-kanan)
          supaya tidak overflow di layar sempit, dan posisinya ikut naik
          mengikuti tombol supaya tetap di atas bottom nav. */}
      {open && (
        <div
          className="fixed z-[999] flex flex-col bg-white rounded-2xl border border-gray-100 left-4 right-4 bottom-[calc(4.5rem+52px+0.75rem+env(safe-area-inset-bottom))] max-h-[min(70vh,460px)] lg:left-auto lg:right-6 lg:bottom-[88px] lg:w-[340px] print:hidden"
          style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.15)' }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
            background: 'linear-gradient(135deg, #1B3A6B, #2563EB)',
            borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>💬</div>
            <div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Asisten AHMS</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Pencarian cepat berbasis kata kunci</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user' ? '#2563EB' : '#f3f4f6',
                  color: m.role === 'user' ? 'white' : '#1a2332',
                  fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-line',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '12px 12px 12px 2px', fontSize: 12, color: '#6b7280' }}>
                  Sedang memproses...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Tanyakan tentang aplikasi..."
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb',
                fontSize: 12, outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                background: '#2563EB', color: 'white', border: 'none', borderRadius: 8,
                padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
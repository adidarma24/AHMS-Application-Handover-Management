import { useState } from 'react'
import type { Role } from '../types'

const ROLES: { role: Role; name: string; desc: string }[] = [
  { role: 'Project Manager', name: 'Andi Pratama', desc: 'Ajukan & kelola handover aplikasi' },
  { role: 'O&M Application Support', name: 'Sari Dewi', desc: 'Review & dukung operasional aplikasi' },
  { role: 'Reviewer Teknis', name: 'Reza Firmansyah', desc: 'Review teknis & keamanan aplikasi' },
  { role: 'Business Owner', name: 'Budi Santoso', desc: 'Validasi kebutuhan bisnis aplikasi' },
  { role: 'Manager O&M', name: 'Pak Haryanto', desc: 'Final approval & dashboard eksekutif' },
  { role: 'System Administrator', name: 'Admin Sistem', desc: 'Kelola master data & konfigurasi sistem' },
]

interface Props {
  onLogin: (role: Role, name: string) => void
}

export default function Login({ onLogin }: Props) {
  const [selectedRole, setSelectedRole] = useState<Role>('Project Manager')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const chosen = ROLES.find(r => r.role === selectedRole)!

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) { setError('Password tidak boleh kosong'); return }
    onLogin(selectedRole, chosen.name)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 50%, #2563EB 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(37,99,235,0.15)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60, width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(27,58,107,0.3)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
            marginBottom: 16, border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="11" height="11" rx="2" fill="#60a5fa" />
              <rect x="17" y="4" width="11" height="11" rx="2" fill="#93c5fd" opacity="0.7" />
              <rect x="4" y="17" width="11" height="11" rx="2" fill="#93c5fd" opacity="0.7" />
              <rect x="17" y="17" width="11" height="11" rx="2" fill="#60a5fa" opacity="0.5" />
            </svg>
          </div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>AHMS</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
            Application Handover Management System
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0', letterSpacing: '0.08em' }}>
            PT PERTAMINA (Persero)
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a2332', margin: '0 0 24px' }}>
            Masuk ke Sistem
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Login sebagai
              </label>
              <select
                value={selectedRole}
                onChange={e => { setSelectedRole(e.target.value as Role); setError('') }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 14, color: '#111827',
                  background: 'white', outline: 'none', cursor: 'pointer',
                }}
              >
                {ROLES.map(r => (
                  <option key={r.role} value={r.role}>{r.role} — {r.name}</option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{chosen.desc}</p>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Masukkan password (demo: apapun)"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`, fontSize: 14, color: '#111827',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</p>}
            </div>

            <button
              type="submit"
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: 'linear-gradient(135deg, #1B3A6B, #2563EB)',
                color: 'white', fontSize: 15, fontWeight: 600, border: 'none',
                cursor: 'pointer', marginTop: 16, letterSpacing: '0.01em',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              Masuk
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20, marginBottom: 0 }}>
            Demo: pilih role lalu masukkan password apapun
          </p>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 16 }}>
          AHMS v2.4.1 — Confidential Internal System
        </p>
      </div>
    </div>
  )
}

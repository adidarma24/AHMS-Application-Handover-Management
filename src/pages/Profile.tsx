import { useMemo } from 'react'
import { Mail, BadgeCheck, Building2, LogOut, ShieldCheck } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import InstallCard from '../components/ui/InstallCard'
import type { AppState, Role } from '../types'

interface Props {
  appState: AppState
  currentUser: { name: string; role: Role; email: string }
  onLogout: () => void
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function Profile({ appState, currentUser, onLogout }: Props) {
  // Cocokkan dengan Master PIC (jika ada) untuk tampilkan departemen & telepon,
  // mirip pola lookup reporting manager di Profile.js ITSM.
  const pic = useMemo(
    () => appState.picList.find(p => p.name === currentUser.name || p.email === currentUser.email),
    [appState.picList, currentUser]
  )
  const account = useMemo(
    () => appState.users.find(u => u.name === currentUser.name),
    [appState.users, currentUser]
  )

  const initials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Informasi akun dan preferensi aplikasi</p>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div
          className="px-5 py-6 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1B3A6B, #2563EB)' }}
        >
          <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-white truncate">{currentUser.name}</p>
            <p className="text-sm text-slate-200">{currentUser.role}</p>
          </div>
        </div>
        <div className="px-5">
          <Row icon={Mail} label="Email Korporat" value={currentUser.email} />
          <Row icon={BadgeCheck} label="Peran" value={currentUser.role} />
          {pic && <Row icon={Building2} label="Departemen" value={pic.department} />}
          {account && (
            <Row
              icon={ShieldCheck}
              label="Status Akun"
              value={account.active ? 'Aktif' : 'Nonaktif'}
            />
          )}
        </div>
      </Card>

      <InstallCard />

      <Card className="space-y-2">
        <Button
          variant="danger"
          className="w-full justify-center"
          onClick={onLogout}
        >
          <LogOut size={14} /> Keluar
        </Button>
      </Card>

      <p className="text-center text-xs text-gray-400">
        Application Handover Management System · PT PERTAMINA (Persero)
      </p>
    </div>
  )
}
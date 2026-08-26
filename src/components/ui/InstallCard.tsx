import { useEffect, useState } from 'react'
import { Smartphone, Share, CheckCircle2 } from 'lucide-react'
import Card from './Card'
import Button from './Button'
import { useToast } from './Toast'
import { onInstallable, promptInstall, isStandalone, isIos } from '../../lib/pwa'

/**
 * Kartu ajakan install AHMS sebagai PWA ke home screen — dipakai di halaman
 * Profile, mirip InstallCard di aplikasi ITSM sebelah. Berguna untuk
 * PIC/Reviewer yang sering cek action item lewat HP.
 */
export default function InstallCard() {
  const { toast } = useToast()
  const [installable, setInstallable] = useState(false)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => onInstallable(setInstallable), [])

  if (installed) {
    return (
      <Card className="flex items-center gap-3">
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
        <p className="text-sm text-gray-600">Aplikasi berjalan dalam mode terpasang (PWA).</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center shrink-0" style={{ background: '#1B3A6B' }}>
          <Smartphone size={16} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Install ke Home Screen</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Pasang AHMS di HP agar terasa seperti aplikasi native — layar penuh, ikon sendiri, dan lebih cepat dibuka.
          </p>
          {isIos() ? (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 flex-wrap">
              Di iPhone/iPad: buka di Safari, ketuk <Share size={13} className="inline" /> <b>Share</b> →
              <b> Add to Home Screen</b>.
            </p>
          ) : (
            <Button
              size="sm"
              className="mt-3"
              onClick={async () => {
                if (installable) {
                  const ok = await promptInstall()
                  if (ok) {
                    setInstalled(true)
                    toast('success', 'Aplikasi terpasang!')
                  }
                } else {
                  toast('info', 'Buka menu browser (⋮) → pilih "Install app" / "Add to Home screen".')
                }
              }}
            >
              <Smartphone size={14} /> Install Aplikasi
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
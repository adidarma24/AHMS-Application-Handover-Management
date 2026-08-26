interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<(installable: boolean) => void>()

/**
 * Setup PWA: dengarkan event 'beforeinstallprompt' (Android/desktop Chrome)
 * dan daftarkan service worker. Dipanggil sekali di main.tsx, sama seperti
 * initPwa() di aplikasi ITSM sebelah.
 */
export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    listeners.forEach((fn) => fn(true))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => fn(false))
  })
  if ('serviceWorker' in navigator) {
    // Pakai import.meta.env.BASE_URL (bukan '/service-worker.js' hardcoded)
    // supaya tetap resolve dengan benar kalau app di-deploy ke subpath
    // (lihat `base` di vite.config.ts yang mengikuti FIGMA_PUBLIC_URL).
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`
    const registerSw = () => navigator.serviceWorker.register(swUrl).catch(() => {})

    // Jika event 'load' sudah keburu terjadi sebelum baris ini dieksekusi
    // (mis. script module ini telat jalan karena network lambat/cache
    // dimatikan), addEventListener('load', ...) TIDAK AKAN PERNAH terpanggil
    // — event yang sudah lewat tidak "diputar ulang". Makanya cek
    // document.readyState dulu: kalau sudah 'complete', daftar SW langsung;
    // kalau belum, baru menunggu event 'load' seperti biasa.
    if (document.readyState === 'complete') {
      registerSw()
    } else {
      window.addEventListener('load', registerSw)
    }
  }
}

export function onInstallable(fn: (installable: boolean) => void) {
  listeners.add(fn)
  fn(!!deferredPrompt)
  return () => {
    listeners.delete(fn)
  }
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') deferredPrompt = null
  return outcome === 'accepted'
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}
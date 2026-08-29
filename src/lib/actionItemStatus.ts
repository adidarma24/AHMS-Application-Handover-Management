import type { ActionItem } from '../types'

/**
 * Status "efektif" sebuah action item, dihitung langsung dari due date —
 * bukan sekadar membaca field `status` yang tersimpan statis.
 *
 * Masalah yang diperbaiki: field `status: 'overdue'` di data cuma snapshot
 * saat data dibuat (lihat data.ts — semua item overdue di-hardcode manual).
 * Kalau item baru ditambahkan lewat form "Tambah Action Item" dan due
 * date-nya lewat begitu saja seiring waktu, field `status` itu TIDAK PERNAH
 * otomatis berubah jadi 'overdue' — tetap 'open' selamanya. Padahal
 * `DueDateTimer` di sebelahnya menghitung "Terlambat X hari" secara live
 * dari tanggal, independen dari field ini. Akibatnya badge status bisa
 * bilang "OPEN" (hijau) sementara timer di sampingnya bilang "Terlambat 3
 * hari" (merah) — dua elemen UI yang saling kontradiksi untuk item yang
 * sama.
 *
 * Fungsi ini jadi SATU sumber kebenaran: dipakai di badge, filter, KPI
 * count, dan aturan eskalasi, supaya semuanya konsisten dan selalu sinkron
 * dengan tanggal hari ini — bukan status yang di-set manual sekali lalu
 * basi.
 */
export function getEffectiveStatus(ai: Pick<ActionItem, 'status' | 'dueDate'>): 'open' | 'completed' | 'overdue' {
  if (ai.status === 'completed') return 'completed'
  const due = new Date(`${ai.dueDate}T23:59:59`)
  if (due.getTime() < Date.now()) return 'overdue'
  return 'open'
}
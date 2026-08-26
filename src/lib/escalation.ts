import type { ActionItem } from '../types'

export interface EscalationInfo {
  escalated: boolean
  critical: boolean
  daysOverdue: number
}

/**
 * Aturan eskalasi otomatis untuk action item overdue, terinspirasi dari
 * EscalationBadge di aplikasi ITSM sebelah. Belum ada tombol eskalasi
 * manual di AHMS, jadi statusnya dihitung langsung dari data yang sudah
 * ada (status + priority + dueDate), bukan field tersimpan terpisah:
 *
 * - "Auto-Escalated"   : item overdue yang wajib (required) atau
 *                        berprioritas high — perlu perhatian ekstra PIC/Reviewer.
 * - "Critical Escalation": item auto-escalated berprioritas high yang sudah
 *                        overdue >= 3 hari — dianggap perlu naik ke Manager O&M.
 */
export function getEscalation(ai: ActionItem): EscalationInfo {
  if (ai.status !== 'overdue') {
    return { escalated: false, critical: false, daysOverdue: 0 }
  }

  const due = new Date(`${ai.dueDate}T23:59:59`)
  const now = new Date()
  const daysOverdue = Math.max(0, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

  const escalated = ai.required || ai.priority === 'high'
  const critical = escalated && ai.priority === 'high' && daysOverdue >= 3

  return { escalated, critical, daysOverdue }
}
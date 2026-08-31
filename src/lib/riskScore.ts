import type { Application } from '../types'
import { getEffectiveStatus } from './actionItemStatus'

export function getEffectiveRiskScore(
  app: Pick<Application, 'riskScore' | 'actionItems' | 'reviewers' | 'submittedDate' | 'documents' | 'status'>
): number {

  if (app.status === 'Handover Accepted') return app.riskScore

  let score = app.riskScore

  const overdueCount = app.actionItems.filter(ai => getEffectiveStatus(ai) === 'overdue').length
  score += Math.min(20, overdueCount * 5)

  if (app.reviewers.some(r => r.status === 'rejected')) score += 20

  const daysSinceSubmit = Math.floor((Date.now() - new Date(app.submittedDate).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceSubmit > 60) score += 15

  if (app.documents.some(d => d.required && !d.uploaded)) score += 10

  return Math.max(0, Math.min(100, score))
}
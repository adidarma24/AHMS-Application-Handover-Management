export type AppStatus =
  | 'Draft'
  | 'Waiting for O&M Review'
  | 'Under Technical Review'
  | 'Rejected'
  | 'Approved'
  | 'Handover Accepted'

export type Criticality = 'Critical' | 'High' | 'Medium' | 'Low'

export type ReviewDecision = 'approved' | 'approved_with_condition' | 'rejected' | 'pending'

export type Role =
  | 'Project Manager'
  | 'O&M Application Support'
  | 'Reviewer Teknis'
  | 'Business Owner'
  | 'Manager O&M'
  | 'System Administrator'

export interface ReviewerStatus {
  role: string
  name: string
  status: ReviewDecision
  notes?: string
  reviewedAt?: string
}

export interface ActionItem {
  id: string
  title: string
  assignee: string
  dueDate: string
  status: 'open' | 'completed' | 'overdue'
  priority: 'high' | 'medium' | 'low'
}

export interface AppDocument {
  id: string
  name: string
  type: string
  uploaded: boolean
  required: boolean
  uploadedAt?: string
}

export interface HistoryEntry {
  id: string
  timestamp: string
  user: string
  action: string
  notes?: string
}

export interface Application {
  id: string
  name: string
  description: string
  criticality: Criticality
  businessOwner: string
  pic: string
  goLiveDate: string
  technology: string
  environment: string
  status: AppStatus
  submittedDate: string
  targetHandoverDate: string
  category: string
  vendor: string
  reviewers: ReviewerStatus[]
  actionItems: ActionItem[]
  documents: AppDocument[]
  history: HistoryEntry[]
  riskScore: number
}

export interface User {
  id: string
  name: string
  role: Role
  email: string
  active: boolean
}

export interface ChecklistItem {
  id: string
  text: string
  criticality: Criticality[]
  required: boolean
}

export interface MasterPIC {
  id: string
  name: string
  email: string
  department: string
  phone: string
}

export interface MasterVendor {
  id: string
  name: string
  contact: string
  email: string
  category: string
}

export interface MasterEnvironment {
  id: string
  name: string
  description: string
  server: string
}

export interface AppState {
  applications: Application[]
  users: User[]
  checklistItems: ChecklistItem[]
  picList: MasterPIC[]
  vendors: MasterVendor[]
  environments: MasterEnvironment[]
}

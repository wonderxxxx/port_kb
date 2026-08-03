export type DomainCode = 'zgt' | 'zlt'

export interface DomainFilterOption {
  label: string
  value: string
}

export interface DomainNavItem {
  key: string
  label: string
  url?: string
  children?: DomainNavItem[]
}

export interface DomainSystemItem {
  name: string
  category: string
  url?: string
}

export interface DomainMessage {
  id: number
  source: string
  title: string
  eventTime: string
  status: 'read' | 'unread'
  content: string
  operateTime?: string
}

export interface DomainMessageQuery {
  source?: string
  keyword?: string
  dateFrom?: string
  dateTo?: string
}

export interface DomainTodo {
  id: number
  source: string
  category: string
  name: string
  startTime: string
  status: 'pending' | 'done' | 'overdue'
  content: string
  thirdSystemName?: string
  thirdSystemUrl?: string
  handleTime?: string
}

export type DomainTodoStatus = DomainTodo['status']

export interface DomainTodoQuery {
  source?: string
  status?: DomainTodoStatus
  dateFrom?: string
  keyword?: string
}

export interface DomainTodoStats {
  pending: number
  done: number
  overdue: number
}

export interface DomainTodoHandleBody {
  description: string
  attachments: string[]
}
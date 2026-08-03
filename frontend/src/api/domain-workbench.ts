import type {
  DomainCode,
  DomainMessage,
  DomainMessageQuery,
  DomainSystemItem,
  DomainTodo,
  DomainTodoHandleBody,
  DomainTodoQuery,
  DomainTodoStats
} from '@/types/api/domain-workbench'
import {
  mockListSystems,
  mockListMessages,
  mockMarkMessageRead,
  mockListTodos,
  mockTodoStats,
  mockHandleTodo
} from '../../mock/store'

interface ApiResponse<T> {
  code?: number
  message?: string
  data: T
}

export function listDomainSystems(domain: DomainCode): Promise<ApiResponse<DomainSystemItem[]>> {
  return Promise.resolve({ data: mockListSystems(domain) })
}

export function listDomainMessages(domain: DomainCode, query?: DomainMessageQuery): Promise<ApiResponse<DomainMessage[]>> {
  return Promise.resolve({ data: mockListMessages(domain, query || {}) })
}

export function markDomainMessageRead(domain: DomainCode, id: number): Promise<ApiResponse<DomainMessage | null>> {
  const result = mockMarkMessageRead(domain, id)
  return Promise.resolve({ data: result || null })
}

export function listDomainTodos(domain: DomainCode, query?: DomainTodoQuery): Promise<ApiResponse<DomainTodo[]>> {
  return Promise.resolve({ data: mockListTodos(domain, query || {}) })
}

export function getDomainTodoStats(domain: DomainCode): Promise<ApiResponse<DomainTodoStats>> {
  return Promise.resolve({ data: mockTodoStats(domain) })
}

export function handleDomainTodo(domain: DomainCode, id: number, body: DomainTodoHandleBody): Promise<ApiResponse<DomainTodo | null>> {
  const result = mockHandleTodo(domain, id, body)
  return Promise.resolve({ data: result || null })
}
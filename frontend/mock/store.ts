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
import { zgtMessages, zgtSystems, zgtTodos } from './zgt'
import { zltMessages, zltSystems, zltTodos } from './zlt'

/** 内存态 mock，按 domain 隔离；刷新页面重置 */
const messageStore: Record<DomainCode, DomainMessage[]> = {
  zgt: structuredClone(zgtMessages),
  zlt: structuredClone(zltMessages)
}

const todoStore: Record<DomainCode, DomainTodo[]> = {
  zgt: structuredClone(zgtTodos),
  zlt: structuredClone(zltTodos)
}

const systemStore: Record<DomainCode, DomainSystemItem[]> = {
  zgt: zgtSystems,
  zlt: zltSystems
}

function nowStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function mockListSystems(domain: DomainCode): DomainSystemItem[] {
  return systemStore[domain]
}

export function mockListMessages(domain: DomainCode, query: DomainMessageQuery = {}): DomainMessage[] {
  let list = [...messageStore[domain]]
  if (query.source) {
    list = list.filter(m => m.source === query.source)
  }
  if (query.keyword) {
    const kw = query.keyword.trim().toLowerCase()
    list = list.filter(m => m.title.toLowerCase().includes(kw))
  }
  if (query.dateFrom) {
    list = list.filter(m => m.eventTime.slice(0, 10) >= query.dateFrom!)
  }
  if (query.dateTo) {
    list = list.filter(m => m.eventTime.slice(0, 10) <= query.dateTo!)
  }
  return list
}

export function mockMarkMessageRead(domain: DomainCode, id: number): DomainMessage | undefined {
  const msg = messageStore[domain].find(m => m.id === id)
  if (!msg) return undefined
  if (msg.status === 'unread') {
    msg.status = 'read'
    msg.operateTime = nowStr()
  }
  return { ...msg }
}

export function mockListTodos(domain: DomainCode, query: DomainTodoQuery = {}): DomainTodo[] {
  let list = [...todoStore[domain]]
  if (query.source) {
    list = list.filter(t => t.source === query.source)
  }
  if (query.status) {
    list = list.filter(t => t.status === query.status)
  }
  if (query.dateFrom) {
    list = list.filter(t => {
      const day = (t.startTime || '').slice(0, 10)
      return day >= query.dateFrom!
    })
  }
  if (query.keyword) {
    const kw = query.keyword.trim().toLowerCase()
    list = list.filter(
      t =>
        t.name.toLowerCase().includes(kw) ||
        t.category.toLowerCase().includes(kw) ||
        t.source.toLowerCase().includes(kw)
    )
  }
  return list
}

export function mockTodoStats(domain: DomainCode): DomainTodoStats {
  const list = todoStore[domain]
  return {
    pending: list.filter(t => t.status === 'pending').length,
    done: list.filter(t => t.status === 'done').length,
    overdue: list.filter(t => t.status === 'overdue').length
  }
}

export function mockHandleTodo(
  domain: DomainCode,
  id: number,
  body: DomainTodoHandleBody
): DomainTodo | undefined {
  const todo = todoStore[domain].find(t => t.id === id)
  if (!todo) return undefined
  todo.status = 'done'
  todo.handleTime = nowStr()
  if (body.description) {
    todo.content = `${todo.content}\n【办理说明】${body.description}`
  }
  return { ...todo }
}

export function mockGetMessage(domain: DomainCode, id: number): DomainMessage | undefined {
  const msg = messageStore[domain].find(m => m.id === id)
  return msg ? { ...msg } : undefined
}

export function mockGetTodo(domain: DomainCode, id: number): DomainTodo | undefined {
  const todo = todoStore[domain].find(t => t.id === id)
  return todo ? { ...todo } : undefined
}

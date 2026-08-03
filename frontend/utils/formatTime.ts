/**
 * 领域工作台时间展示
 * zlt：事件时间去年份；操作时间 HH:mm；开始时间 月-日；办理时间 月-日 时:分
 * 其它域：原样展示
 */

function parseDate(input?: string): Date | null {
  if (!input || input === '——' || input === '-') return null
  // 兼容 "2025-12-01 10:24" / "2025-12-01" / ISO
  const normalized = input.trim().replace(/-/g, '/')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 事件时间：MM-DD HH:mm（不展示年份） */
export function formatEventTime(input?: string, compact?: boolean): string {
  if (!input) return '——'
  if (!compact) return input
  const d = parseDate(input)
  if (!d) return input
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 操作时间：HH:mm */
export function formatOperateTime(input?: string, compact?: boolean): string {
  if (!input || input === '——' || input === '-') return '——'
  if (!compact) return input
  const d = parseDate(input)
  if (!d) {
    // 已是短时间串则直接返回
    if (/^\d{1,2}:\d{2}/.test(input)) return input.slice(0, 5)
    return input
  }
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 开始时间：MM-DD */
export function formatStartTime(input?: string, compact?: boolean): string {
  if (!input) return '——'
  if (!compact) return input
  const d = parseDate(input)
  if (!d) return input
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 办理时间：MM-DD HH:mm */
export function formatHandleTime(input?: string, compact?: boolean): string {
  if (!input || input === '——' || input === '-') return '——'
  if (!compact) return input
  const d = parseDate(input)
  if (!d) return input
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

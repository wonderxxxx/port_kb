import type {
  DomainCode,
  DomainFilterOption,
  DomainNavItem,
  DomainSystemItem
} from '@/types/api/domain-workbench'

/** 领域工作台页面配置（前端配置，非接口） */
export interface DomainWorkbenchConfig {
  domainCode: DomainCode
  title: string
  subtitle?: string
  routePath: string
  nav: DomainNavItem[]
  messageSources: DomainFilterOption[]
  /** 待办来源筛选项（缺省则用 messageSources） */
  todoSources?: DomainFilterOption[]
  /** 是否展示消息日期筛选（浙路通） */
  messageDateFilter: boolean
  /** 是否展示待办三格统计（浙港通有，浙路通无） */
  todoStatsVisible?: boolean
  /**
   * 待办完整筛选：来源 + 状态 + 日期 + 关键词（浙路通）
   * 默认仅状态筛选
   */
  todoRichFilters?: boolean
  /**
   * 列表时间紧凑展示（浙路通）：
   * 事件时间 MM-DD HH:mm；操作时间 HH:mm；开始时间 MM-DD；办理时间 MM-DD HH:mm
   */
  compactDateTime?: boolean
  systems: DomainSystemItem[]
  /** 地图组件（SFC） */
  mapComponent: object
  /** 公路路名搜索占位（可选） */
  roadSearchPlaceholder?: string
}

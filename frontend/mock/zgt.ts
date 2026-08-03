import type { DomainMessage, DomainSystemItem, DomainTodo } from '@/types/api/domain-workbench'

export const zgtSystems: DomainSystemItem[] = [
  { name: '省-水上服务区管理系统', category: '水上服务区', url: '#' },
  { name: '市-水上服务区管理系统', category: '水上服务区', url: '#' },
  { name: '省-养护系统', category: '智慧养护', url: '#' },
  { name: '市-航道养护系统', category: '智慧养护', url: '#' },
  { name: '区县-航道养护系统', category: '智慧养护', url: '#' },
  { name: '智慧海事系统', category: '智慧海事', url: '#' },
  { name: '市-码头管理系统', category: '智慧码头', url: '#' },
  { name: '数据集成管理', category: '数据集成', url: '#' },
  { name: '设备集成管理', category: '设备集成', url: '#' }
]

export const zgtMessages: DomainMessage[] = [
  {
    id: 1,
    source: '智慧养护',
    title: '婺城航道养护工程竣工验收通知',
    eventTime: '2026-07-15 14:30',
    status: 'unread',
    content:
      '根据年度养护计划安排，婺城段航道养护工程已完成全部施工内容，现定于2026年7月20日组织竣工验收。请相关单位做好准备，届时派员参加。'
  },
  {
    id: 2,
    source: '智慧海事',
    title: '金华江水域通航秩序专项检查通报',
    eventTime: '2026-07-15 10:15',
    status: 'unread',
    content:
      '2026年7月12日至14日，金华市海事局对金华江主航道水域进行了通航秩序专项检查。共检查船舶47艘次，发现问题12项。'
  },
  {
    id: 3,
    source: '水上服务区',
    title: '兰溪服务区供水设备检修通知',
    eventTime: '2026-07-14 16:45',
    status: 'read',
    operateTime: '2026-07-14 17:20',
    content: '兰溪水上服务区计划于2026年7月18日8:00-18:00暂停供水。请停靠船舶提前储备用水。'
  },
  {
    id: 4,
    source: '智慧码头',
    title: '义乌码头吞吐量月度统计报告',
    eventTime: '2026-07-14 09:00',
    status: 'read',
    operateTime: '2026-07-14 10:05',
    content: '义乌码头6月份完成吞吐量环比增长8.2%，集装箱作业效率提升。详情见附件报告。'
  },
  {
    id: 5,
    source: '浙港通平台',
    title: '平台系统维护窗口通知',
    eventTime: '2026-07-13 18:00',
    status: 'unread',
    content: '浙港通平台将于7月19日凌晨2:00-4:00进行例行维护，期间部分服务可能短暂不可用。'
  }
]

export const zgtTodos: DomainTodo[] = [
  {
    id: 1,
    source: '智慧养护',
    category: '养护工单',
    name: '婺城航道浮标复位作业',
    startTime: '2026-07-14',
    status: 'pending',
    content: '巡查发现婺城段航道K12+300处浮标因水流冲击发生位移，需安排养护船只前往复位。',
    thirdSystemName: '省-养护系统',
    thirdSystemUrl: '#'
  },
  {
    id: 2,
    source: '智慧海事',
    category: '安全检查',
    name: '金华港危险品船舶安检',
    startTime: '2026-07-13',
    status: 'pending',
    content: '对本周停靠金华港的危险品船舶进行安全检查，包括证书、消防与防污染设备等。',
    thirdSystemName: '智慧海事系统',
    thirdSystemUrl: '#'
  },
  {
    id: 3,
    source: '水上服务区',
    category: '设施维护',
    name: '兰溪服务区监控设备升级',
    startTime: '2026-07-12',
    status: 'overdue',
    content: '兰溪水上服务区需更换12台摄像头，新增4台覆盖盲区。',
    thirdSystemName: '市-水上服务区管理系统',
    thirdSystemUrl: '#'
  },
  {
    id: 4,
    source: '智慧码头',
    category: '运营报告',
    name: '6月份码头运营数据审核',
    startTime: '2026-07-10',
    status: 'done',
    handleTime: '2026-07-11 15:30',
    content: '完成义乌码头6月运营数据审核并归档。',
    thirdSystemName: '市-码头管理系统',
    thirdSystemUrl: '#'
  },
  {
    id: 5,
    source: '智慧养护',
    category: '巡查任务',
    name: '金华江航道月度巡查',
    startTime: '2026-07-08',
    status: 'done',
    handleTime: '2026-07-09 11:00',
    content: '完成金华江主航道月度巡查，未见重大隐患。',
    thirdSystemName: '市-航道养护系统',
    thirdSystemUrl: '#'
  },
  {
    id: 6,
    source: '智慧海事',
    category: '专项整治',
    name: '非法采砂线索核查',
    startTime: '2026-07-11',
    status: 'pending',
    content: '群众举报兰溪段疑似非法采砂活动，请现场核查并反馈。',
    thirdSystemName: '智慧海事系统',
    thirdSystemUrl: '#'
  },
  {
    id: 7,
    source: '水上服务区',
    category: '服务保障',
    name: '暑期停靠高峰保障方案确认',
    startTime: '2026-07-15',
    status: 'pending',
    content: '确认各水上服务区暑期高峰人员与物资保障方案。',
    thirdSystemName: '市-水上服务区管理系统',
    thirdSystemUrl: '#'
  },
  {
    id: 8,
    source: '智慧码头',
    category: '设备维保',
    name: '东阳港装卸设备年检',
    startTime: '2026-07-05',
    status: 'done',
    handleTime: '2026-07-06 16:40',
    content: '东阳港装卸设备年检合格，报告已上传。',
    thirdSystemName: '市-码头管理系统',
    thirdSystemUrl: '#'
  }
]

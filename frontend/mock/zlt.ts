import type { DomainMessage, DomainSystemItem, DomainTodo } from '@/types/api/domain-workbench'

export const zltSystems: DomainSystemItem[] = [
  { name: '省-路网监测', category: '路网监测', url: '#' },
  { name: '市-公路交调', category: '路网监测', url: '#' },
  { name: '省-综合治超', category: '路政管理', url: '#' },
  { name: '市-路产路权', category: '路政管理', url: '#' },
  { name: '市-路域环境', category: '路政管理', url: '#' },
  { name: '区县-路政巡查', category: '路政管理', url: '#' },
  { name: '市-高速救援', category: '路政管理', url: '#' },
  { name: '区县-边坡管理', category: '养护管理', url: '#' },
  { name: '市-科学决策', category: '养护管理', url: '#' },
  { name: '区县-隧管家', category: '养护管理', url: '#' },
  { name: '省-浙路智富', category: '农村公路', url: '#' },
  { name: '应急指挥调度', category: '公路安全应急', url: '#' },
  { name: '突发事件上报', category: '公路安全应急', url: '#' },
  { name: '指标总览报表', category: '指标监测', url: '#' },
  { name: '指标趋势分析', category: '指标监测', url: '#' },
  { name: '监测预警中心', category: '指标监测', url: '#' },
  { name: '绩效模型配置', category: '指标监测', url: '#' },
  { name: '模型版本管理', category: '指标监测', url: '#' },
  { name: '算法调度配置', category: '指标监测', url: '#' }
]

export const zltMessages: DomainMessage[] = [
  {
    id: 1,
    source: '路网监测',
    title: 'G60沪昆高速超限预警 3辆货车涉嫌超载',
    eventTime: '2025-12-01 10:24',
    status: 'unread',
    content:
      '经省治超系统检测，G60沪昆高速金华段K123+450处检测到3辆货运车辆涉嫌超限运输，平均超限率18%，请通知辖区路政执法人员前往现场核查处置。'
  },
  {
    id: 2,
    source: '养护管理',
    title: 'S313省道边坡隐患预警 降雨后溜方风险',
    eventTime: '2025-12-01 09:15',
    status: 'read',
    operateTime: '2025-12-01 11:05',
    content: 'S313省道边坡在连续降雨后存在溜方风险，请相关养护单位加强巡查。'
  },
  {
    id: 3,
    source: '路政管理',
    title: '金义快速路路域环境违规堆放整治通知',
    eventTime: '2025-11-30 16:40',
    status: 'unread',
    content: '金义快速路沿线发现违规堆放建筑材料，请路域环境管理单位组织整治。'
  },
  {
    id: 4,
    source: '农村公路',
    title: '永康市乡道Y032路面破损预警',
    eventTime: '2025-11-30 14:22',
    status: 'read',
    operateTime: '2025-11-30 15:10',
    content: '永康市乡道Y032出现路面破损，建议尽快安排养护处治。'
  },
  {
    id: 5,
    source: '安全应急',
    title: 'G25长深高速交通事故预警',
    eventTime: '2025-11-30 10:08',
    status: 'unread',
    content: 'G25长深高速金华段发生交通事故，请应急指挥关注交通管制与救援进展。'
  },
  {
    id: 6,
    source: '指标监测',
    title: '11月全市公路完好率指标预警',
    eventTime: '2025-11-29 17:30',
    status: 'read',
    operateTime: '2025-11-30 09:12',
    content: '11月全市公路完好率接近预警阈值，请关注养护进度与指标趋势。'
  }
]

export const zltTodos: DomainTodo[] = [
  {
    id: 1,
    source: '路政管理',
    category: '路产路权',
    name: 'G330国道护栏损坏核查',
    startTime: '2025-11-28',
    status: 'pending',
    content: 'G330国道K25+300处护栏被车辆撞损，长度约12米，需现场核查并评估维修方案。',
    thirdSystemName: '市-路产路权管理系统',
    thirdSystemUrl: '#'
  },
  {
    id: 2,
    source: '养护管理',
    category: '边坡治理',
    name: 'S313省道边坡治理验收',
    startTime: '2025-11-30',
    status: 'done',
    handleTime: '2025-12-01 09:30',
    content: 'S313省道边坡治理工程验收。',
    thirdSystemName: '区县-边坡管理',
    thirdSystemUrl: '#'
  },
  {
    id: 3,
    source: '养护管理',
    category: '养护巡查',
    name: '武义县乡道养护任务',
    startTime: '2025-11-25',
    status: 'overdue',
    content: '武义县乡道例行养护任务尚未办结。',
    thirdSystemName: '市-科学决策',
    thirdSystemUrl: '#'
  },
  {
    id: 4,
    source: '路政管理',
    category: '路域环境',
    name: '金义快速路违规堆放整治反馈',
    startTime: '2025-11-29',
    status: 'pending',
    content: '反馈金义快速路违规堆放整治结果。',
    thirdSystemName: '市-路域环境',
    thirdSystemUrl: '#'
  },
  {
    id: 5,
    source: '养护管理',
    category: '隧管家',
    name: '金华山隧道消防设施巡检',
    startTime: '2025-11-27',
    status: 'pending',
    content: '完成金华山隧道消防设施巡检并上传记录。',
    thirdSystemName: '区县-隧管家',
    thirdSystemUrl: '#'
  },
  {
    id: 6,
    source: '安全应急',
    category: '应急演练',
    name: '12月高速应急演练筹备确认',
    startTime: '2025-12-01',
    status: 'pending',
    content: '确认12月高速应急演练人员、物资与时间安排。',
    thirdSystemName: '应急指挥调度',
    thirdSystemUrl: '#'
  },
  {
    id: 7,
    source: '路网监测',
    category: '交调核查',
    name: '市域交调点位数据异常复核',
    startTime: '2025-11-26',
    status: 'overdue',
    content: '部分公路交调点位数据异常，需复核设备与上报链路。',
    thirdSystemName: '市-公路交调',
    thirdSystemUrl: '#'
  },
  {
    id: 8,
    source: '农村公路',
    category: '农路巡查',
    name: '永康Y032破损路段复核',
    startTime: '2025-11-30',
    status: 'done',
    handleTime: '2025-12-01 08:20',
    content: '复核永康Y032破损路段并登记养护需求。',
    thirdSystemName: '省-浙路智富',
    thirdSystemUrl: '#'
  }
]

/** 路名搜索 mock 库 */
export const zltRoadNames: string[] = [
  'G60沪昆高速',
  'G25长深高速',
  'G330国道',
  'S313省道',
  '金义快速路',
  '永康Y032'
]

import type { DomainWorkbenchConfig } from './types'
import RoadMap from '../maps/RoadMap.vue'
import { zltSystems } from '../mock/zlt'

const zltConfig: DomainWorkbenchConfig = {
  domainCode: 'zlt',
  title: '浙路通·金华市公路工作台',
  routePath: '/domain/zlt',
  messageDateFilter: true,
  todoStatsVisible: false,
  compactDateTime: true,
  todoRichFilters: true,
  roadSearchPlaceholder: '请输入金华市公路名称（如G60沪昆高速）',
  messageSources: [
    { label: '路网监测', value: '路网监测' },
    { label: '路政管理', value: '路政管理' },
    { label: '养护管理', value: '养护管理' },
    { label: '农村公路', value: '农村公路' },
    { label: '安全应急', value: '安全应急' },
    { label: '指标监测', value: '指标监测' }
  ],
  // 对齐原型：全部来源 + 路政/养护/农路，并补全 mock 中有的来源
  todoSources: [
    { label: '路政管理', value: '路政管理' },
    { label: '养护管理', value: '养护管理' },
    { label: '农村公路', value: '农村公路' },
    { label: '安全应急', value: '安全应急' },
    { label: '路网监测', value: '路网监测' }
  ],
  systems: zltSystems,
  mapComponent: RoadMap,
  nav: [
    {
      key: 'network',
      label: '路网监测',
      children: [
        { key: 'n1', label: '省-路网监测', url: '#' },
        { key: 'n2', label: '市-公路交调', url: '#' }
      ]
    },
    {
      key: 'admin',
      label: '路政管理',
      children: [
        { key: 'a1', label: '省-综合治超', url: '#' },
        { key: 'a2', label: '市-路产路权', url: '#' },
        { key: 'a3', label: '市-路域环境', url: '#' },
        { key: 'a4', label: '区县-路政巡查', url: '#' },
        { key: 'a5', label: '市-高速救援', url: '#' }
      ]
    },
    {
      key: 'maintain',
      label: '养护管理',
      children: [
        { key: 'm1', label: '区县-边坡管理', url: '#' },
        { key: 'm2', label: '市-科学决策', url: '#' },
        { key: 'm3', label: '区县-隧管家', url: '#' }
      ]
    },
    {
      key: 'rural',
      label: '农村公路',
      children: [{ key: 'r1', label: '省-浙路智富', url: '#' }]
    },
    {
      key: 'emergency',
      label: '公路安全应急',
      children: [
        { key: 'e1', label: '应急指挥调度', url: '#' },
        { key: 'e2', label: '突发事件上报', url: '#' }
      ]
    },
    {
      key: 'kpi',
      label: '指标监测',
      children: [
        { key: 'k1', label: '指标总览报表', url: '#' },
        { key: 'k2', label: '指标趋势分析', url: '#' },
        { key: 'k3', label: '监测预警中心', url: '#' },
        { key: 'k4', label: '绩效模型配置', url: '#' },
        { key: 'k5', label: '模型版本管理', url: '#' },
        { key: 'k6', label: '算法调度配置', url: '#' }
      ]
    }
  ]
}

export default zltConfig

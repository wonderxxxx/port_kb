import type { DomainWorkbenchConfig } from './types'
import WaterwayMap from '../maps/WaterwayMap.vue'
import { zgtSystems } from '../mock/zgt'

const zgtConfig: DomainWorkbenchConfig = {
  domainCode: 'zgt',
  title: '浙港通',
  subtitle: '金华市水路交通智慧管理平台',
  routePath: '/domain/zgt',
  messageDateFilter: false,
  todoStatsVisible: true,
  compactDateTime: false,
  messageSources: [
    { label: '智慧养护', value: '智慧养护' },
    { label: '智慧海事', value: '智慧海事' },
    { label: '水上服务区', value: '水上服务区' },
    { label: '智慧码头', value: '智慧码头' },
    { label: '浙港通平台', value: '浙港通平台' }
  ],
  systems: zgtSystems,
  mapComponent: WaterwayMap,
  nav: [
    {
      key: 'service',
      label: '水上服务区',
      children: [
        { key: 'svc-prov', label: '省-水上服务区管理系统', url: '#' },
        { key: 'svc-city', label: '市-水上服务区管理系统', url: '#' }
      ]
    },
    {
      key: 'maintain',
      label: '智慧养护',
      children: [
        { key: 'm-prov', label: '省-养护系统', url: '#' },
        { key: 'm-city', label: '市-航道养护系统', url: '#' },
        { key: 'm-county', label: '区县-航道养护系统', url: '#' }
      ]
    },
    {
      key: 'maritime',
      label: '智慧海事',
      url: '#'
    },
    {
      key: 'port',
      label: '智慧码头',
      children: [{ key: 'port-city', label: '市-码头管理系统', url: '#' }]
    },
    {
      key: 'data',
      label: '数据集成管理',
      url: '#'
    },
    {
      key: 'device',
      label: '设备集成管理',
      url: '#'
    },
    {
      key: 'qa',
      label: '智能问答',
      children: [
        { key: 'qa-chat', label: '智能问答', url: '/domain/zgt/qa' },
        { key: 'qa-knowledge', label: '知识库管理', url: '/domain/zgt/knowledge' }
      ]
    }
  ]
}

export default zgtConfig

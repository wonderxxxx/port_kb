import type { DomainCode } from '@/types/api/domain-workbench'
import type { DomainWorkbenchConfig } from './types'
import zgtConfig from './zgt'
import zltConfig from './zlt'

const configs: Record<DomainCode, DomainWorkbenchConfig> = {
  zgt: zgtConfig,
  zlt: zltConfig
}

export function getDomainConfig(code: DomainCode): DomainWorkbenchConfig {
  return configs[code]
}

export type { DomainWorkbenchConfig }

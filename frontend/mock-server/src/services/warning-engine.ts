export interface WarningRule {
  id: string;
  type: string;
  condition: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  enabled: boolean;
}

export const defaultRules: WarningRule[] = [
  { id: 'R001', type: '水文预警', condition: '水位 >= 警戒水位 * 0.9', level: 'yellow', enabled: true },
  { id: 'R002', type: '水文预警', condition: '水位 >= 警戒水位', level: 'orange', enabled: true },
  { id: 'R003', type: '水文预警', condition: '水位 >= 危险水位', level: 'red', enabled: true },
  { id: 'R004', type: '气象预警', condition: '降雨量 >= 50mm/24h', level: 'orange', enabled: true },
  { id: 'R005', type: '气象预警', condition: '降雨量 >= 100mm/24h', level: 'red', enabled: true },
  { id: 'R006', type: '泄洪预警', condition: '泄洪流量 >= 1500 m³/s', level: 'yellow', enabled: true },
  { id: 'R007', type: '泄洪预警', condition: '泄洪流量 >= 2500 m³/s', level: 'orange', enabled: true },
  { id: 'R008', type: '泄洪预警', condition: '泄洪流量 >= 3500 m³/s', level: 'red', enabled: true },
  { id: 'R009', type: '船舶预警', condition: '锚地占用率 >= 80%', level: 'yellow', enabled: true },
  { id: 'R010', type: '船舶预警', condition: '流速 > 3.0m/s 且 船舶功率 < 1000kW', level: 'orange', enabled: true },
  { id: 'R011', type: '交通预警', condition: '桥区船舶数量 >= 3', level: 'blue', enabled: true },
  { id: 'R012', type: '交通预警', condition: '桥区船舶数量 >= 6', level: 'yellow', enabled: true },
];

export interface ThreatAssessment {
  shipId: string;
  shipName: string;
  power: number;
  velocity: number;
  riskLevel: 'safe' | 'caution' | 'danger';
  recommendation: string;
}

export function assessVesselThreat(
  shipPower: number,
  currentVelocity: number,
  shipType: string
): ThreatAssessment['riskLevel'] {
  const powerToVelocityRatio = shipPower / Math.max(currentVelocity, 0.1);
  if (currentVelocity > 3.5 && shipPower < 1500) return 'danger';
  if (currentVelocity > 2.5 && shipPower < 1000) return 'danger';
  if (currentVelocity > 2.0 && shipPower < 800) return 'caution';
  if (powerToVelocityRatio < 300) return 'caution';
  return 'safe';
}

export function evaluateWarningLevel(
  hydrologyData: { level: number; warningLevel: number; dangerLevel: number },
  weatherData: { rainfall: number },
  floodData: { flow: number }
): { level: 'blue' | 'yellow' | 'orange' | 'red'; triggers: string[] } {
  const triggers: string[] = [];
  let level: 'blue' | 'yellow' | 'orange' | 'red' = 'blue';

  const waterRatio = hydrologyData.level / hydrologyData.warningLevel;
  if (waterRatio >= 1.0) {
    triggers.push('水位超警戒线');
    level = 'orange';
  } else if (waterRatio >= 0.85) {
    triggers.push('水位接近警戒线');
    level = level === 'blue' ? 'yellow' : level;
  }
  if (hydrologyData.level >= hydrologyData.dangerLevel) {
    triggers.push('水位超危险线');
    level = 'red';
  }
  if (weatherData.rainfall >= 100) {
    triggers.push('大暴雨（100mm+）');
    level = 'red';
  } else if (weatherData.rainfall >= 50) {
    triggers.push('暴雨（50mm+）');
    level = Math.max(level === 'red' ? 3 : 2, level === 'yellow' ? 2 : 1) as 'blue' | 'yellow' | 'orange' | 'red';
    if (level === 'yellow') level = weatherData.rainfall >= 80 ? 'orange' : 'yellow';
  }
  if (floodData.flow >= 3500) {
    triggers.push('泄洪流量超3500m³/s');
    level = 'red';
  } else if (floodData.flow >= 2500) {
    triggers.push('泄洪流量超2500m³/s');
    level = level === 'red' ? 'red' : 'orange';
  } else if (floodData.flow >= 1500) {
    triggers.push('泄洪流量超1500m³/s');
    if (level === 'blue') level = 'yellow';
  }

  return { level, triggers };
}

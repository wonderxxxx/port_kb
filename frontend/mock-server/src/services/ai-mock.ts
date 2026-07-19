import { readFileSync } from 'fs';
import { join } from 'path';

const warnings = JSON.parse(
  readFileSync(join(__dirname, '../mock-data/warnings.json'), 'utf-8')
);

export interface AIDetection {
  id: string;
  type: string;
  camera: string | null;
  time: string;
  confidence: number;
  description: string;
  thumbnail: string | null;
  status: string;
  shipId: string;
  reviewNote?: string;
}

export function getAIDetections(): AIDetection[] {
  const enhanced = warnings.aiDetections.map((d: AIDetection) => ({
    ...d,
    thumbnail: d.thumbnail || `/screenshots/mock-detection-${d.type.replace(/[^a-zA-Z]/g, '')}.jpg`,
  }));
  return enhanced;
}

export function reviewDetection(id: string, status: '已确认' | '已驳回', note?: string): AIDetection | null {
  const detection = warnings.aiDetections.find((d: AIDetection) => d.id === id);
  if (!detection) return null;
  detection.status = status;
  if (note) detection.reviewNote = note;
  return detection;
}

export function getDetectionStats() {
  const detections = warnings.aiDetections;
  return {
    total: detections.length,
    pending: detections.filter((d: AIDetection) => d.status === '待审核').length,
    confirmed: detections.filter((d: AIDetection) => d.status === '已确认').length,
    rejected: detections.filter((d: AIDetection) => d.status === '已驳回').length,
    byType: [
      { type: '救生衣违规', count: detections.filter((d: AIDetection) => d.type === '救生衣违规').length },
      { type: '超载嫌疑', count: detections.filter((d: AIDetection) => d.type === '超载嫌疑').length },
      { type: '桥区追越', count: detections.filter((d: AIDetection) => d.type === '桥区追越').length },
      { type: 'AIS信号异常', count: detections.filter((d: AIDetection) => d.type === 'AIS信号异常').length },
      { type: '未授权进入', count: detections.filter((d: AIDetection) => d.type === '未授权进入').length },
    ],
    trend: [
      { date: '06-11', count: 8 }, { date: '06-12', count: 12 }, { date: '06-13', count: 5 },
      { date: '06-14', count: 15 }, { date: '06-15', count: 10 }, { date: '06-16', count: 7 },
      { date: '06-17', count: 5 },
    ],
  };
}

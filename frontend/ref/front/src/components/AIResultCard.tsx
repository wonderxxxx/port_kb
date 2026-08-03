import { AIDetection } from '../types';
import { StatusTag } from './StatusBadge';

interface AIResultCardProps {
  detection: AIDetection;
  onReview?: (id: string, status: string) => void;
  onViewEvidence?: (detection: AIDetection) => void;
}

const typeColors: Record<string, string> = {
  '救生衣违规': 'bg-orange-500',
  '超载嫌疑': 'bg-red-500',
  '桥区追越': 'bg-yellow-500',
  'AIS信号异常': 'bg-purple-500',
  '未授权进入': 'bg-rose-500',
};

const confidenceColor = (v: number) => (v >= 0.85 ? 'text-red-600' : v >= 0.7 ? 'text-orange-500' : 'text-yellow-600');

export function AIResultCard({ detection, onReview, onViewEvidence }: AIResultCardProps) {
  return (
    <div className="card hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${typeColors[detection.type] || 'bg-slate-400'}`} />
          <div>
            <h4 className="text-sm font-medium text-slate-800">{detection.type}</h4>
            <p className="text-xs text-slate-400">{detection.camera || '系统数据检测'}</p>
          </div>
        </div>
        <StatusTag status={detection.status} />
      </div>
      <p className="text-sm text-slate-600 mb-2">{detection.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className={confidenceColor(detection.confidence)}>
          置信度: {(detection.confidence * 100).toFixed(0)}%
        </span>
        <span className="text-slate-400">{new Date(detection.time).toLocaleString('zh-CN')}</span>
      </div>
      {detection.reviewNote && (
        <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">审查意见: {detection.reviewNote}</p>
      )}
      {onViewEvidence && (
        <button onClick={()=>onViewEvidence(detection)} className="mt-2 w-full px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded hover:bg-purple-100">查看证据/截图</button>
      )}
      {onReview && detection.status === '待审核' && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100">
          <button onClick={() => onReview(detection.id, '已确认')} className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">确认违法</button>
          <button onClick={() => onReview(detection.id, '已驳回')} className="flex-1 px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300 transition-colors">驳回线索</button>
        </div>
      )}
    </div>
  );
}

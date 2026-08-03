import { Warning } from '../types';
import { StatusBadge, StatusTag } from './StatusBadge';

interface WarningPanelProps {
  warnings: Warning[];
  onReview?: (id: string, status: string) => void;
}

export function WarningPanel({ warnings, onReview }: WarningPanelProps) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">预警事件</h3>
        <span className="text-xs text-slate-400">{warnings.length} 条</span>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {warnings.map((w) => (
          <div key={w.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge level={w.level} />
                  <span className="text-xs text-slate-400">{w.type}</span>
                </div>
                <h4 className="text-sm font-medium text-slate-800 truncate">{w.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{w.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>来源: {w.source}</span>
                  <span>{new Date(w.time).toLocaleString('zh-CN')}</span>
                  <StatusTag status={w.status} />
                </div>
              </div>
              {onReview && w.status === '待审核' && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => onReview(w.id, '已推送')} className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">通过</button>
                  <button onClick={() => onReview(w.id, '已驳回')} className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300 transition-colors">驳回</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {warnings.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无预警事件</div>
        )}
      </div>
    </div>
  );
}

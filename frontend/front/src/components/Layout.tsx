import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { AIChatWidget } from './AIChatWidget';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { IconUser, IconLogOut } from './Icons';

export function Layout({ children }: { children: ReactNode }) {
  const { data: wsData, connected } = useWebSocket();
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main content area */}
      <div className="ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">水上交通智能分析平台</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                辖区: 兰溪—龙游段（衢江干流） | 金华航区
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* WS connection status */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-xs text-slate-500">{connected ? '实时连接' : '离线'}</span>
              </div>
              {/* Active warning count */}
              {wsData && (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg">
                  <span className="text-xs text-red-600 font-medium">待处理预警: {wsData.warnings} 条</span>
                </div>
              )}
              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <IconUser className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{user.full_name || user.username}</p>
                    <p className="text-xs text-slate-400">{user.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="退出登录"
                  >
                    <IconLogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* Time */}
              <div className="text-right">
                <p className="text-sm font-mono text-slate-700">{time.toLocaleTimeString('zh-CN')}</p>
                <p className="text-xs text-slate-400">{time.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Floating AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}

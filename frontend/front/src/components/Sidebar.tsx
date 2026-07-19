import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { IconDashboard, IconWarning, IconShip, IconEye, IconDocument, IconAnchor, IconChart, IconTarget, IconList } from './Icons';

const navItems = [
  { path: '/', label: '系统总览', Icon: IconDashboard },
  { path: '/illegal-behavior', label: '违法行为识别', Icon: IconEye },
  { path: '/ai-assistant', label: '智能问答助手', Icon: IconDocument },
  { path: '/report-center', label: '报告中心', Icon: IconDocument },
  { path: '/knowledge-base', label: '知识库管理', Icon: IconList },
  { path: '/model-center', label: '模型中心', Icon: IconChart },
  { path: '/data-annotation', label: '数据标注', Icon: IconTarget },
  { path: '/system-logs', label: '系统日志', Icon: IconList },
];

const earlyWarningSubs = [
  { path: '/early-warning', label: '预警总览' },
  { path: '/early-warning/power-velocity', label: '动力流速分析' },
  { path: '/early-warning/berths-monitor', label: '锚地泊位监控' },
  { path: '/early-warning/bridge-monitor', label: '桥区监控' },
];

const subItems = [
  { path: '/ship-scheduling/submit', label: '上游申报' },
  { path: '/ship-scheduling/consolidate', label: '调度审核' },
  { path: '/ship-scheduling/berths', label: '泊位管理' },
];

export function Sidebar() {
  const location = useLocation();
  const [shipExpanded, setShipExpanded] = useState(false);
  const [warnExpanded, setWarnExpanded] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/ship-scheduling')) setShipExpanded(true);
    if (location.pathname.startsWith('/early-warning')) setWarnExpanded(true);
  }, [location.pathname]);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="px-5 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <IconAnchor className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-base font-bold tracking-wide">水上交通智能分析平台</h1>
            <p className="text-xs text-slate-400 mt-0.5">金华市港航管理中心</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Top-level nav items */}
        {navItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Collapsible: 汛期预警管控 */}
        <div>
          <button onClick={()=>setWarnExpanded(!warnExpanded)} className={`sidebar-link w-full text-left flex items-center gap-3 ${location.pathname.startsWith('/early-warning/power')?'text-white bg-slate-800':''}`}>
            <IconWarning className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">汛期预警管控</span>
            <svg className={`w-3 h-3 transition-transform ${warnExpanded?'rotate-90':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          {warnExpanded && (
            <div className="ml-6 space-y-0.5 mt-0.5 border-l border-slate-700 pl-3">
              {earlyWarningSubs.map(({path,label})=>(
                <NavLink key={path} to={path} className={({isActive})=>`block px-3 py-2 rounded-lg text-xs transition-colors ${isActive?'bg-blue-600 text-white':'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{label}</NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible: 船舶调度管理 */}
        <div>
          <button
            onClick={() => setShipExpanded(!shipExpanded)}
            className={`sidebar-link w-full text-left flex items-center gap-3 ${location.pathname.startsWith('/ship-scheduling') ? 'text-white bg-slate-800' : ''}`}
          >
            <IconShip className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">船舶调度管理</span>
            <svg className={`w-3 h-3 transition-transform ${shipExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {shipExpanded && (
            <div className="ml-6 space-y-0.5 mt-0.5 border-l border-slate-700 pl-3">
              {subItems.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500">
          <p>杭州·金华·衢州</p>
          <p className="mt-1">衢江流域（兰溪-龙游段）</p>
          <p className="mt-2 text-slate-600">v1.0.0 原型系统</p>
        </div>
      </div>
    </aside>
  );
}

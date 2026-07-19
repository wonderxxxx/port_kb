import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import EarlyWarning from './pages/EarlyWarning';
import PowerVelocity from './pages/PowerVelocity';
import BerthsMonitor from './pages/BerthsMonitor';
import BridgeMonitor from './pages/BridgeMonitor';
import UpstreamSubmit from './pages/UpstreamSubmit';
import ConsolidateManage from './pages/ConsolidateManage';
import BerthManage from './pages/BerthManage';
import IllegalBehavior from './pages/IllegalBehavior';
import AIAssistant from './pages/AIAssistant';
import ModelCenter from './pages/ModelCenter';
import DataAnnotation from './pages/DataAnnotation';
import KnowledgeBase from './pages/KnowledgeBase';
import ReportCenter from './pages/ReportCenter';
import SystemLogs from './pages/SystemLogs';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/early-warning" element={<EarlyWarning />} />
        <Route path="/early-warning/power-velocity" element={<PowerVelocity />} />
        <Route path="/early-warning/berths-monitor" element={<BerthsMonitor />} />
        <Route path="/early-warning/bridge-monitor" element={<BridgeMonitor />} />
        <Route path="/ship-scheduling/submit" element={<UpstreamSubmit />} />
        <Route path="/ship-scheduling/consolidate" element={<ConsolidateManage />} />
        <Route path="/ship-scheduling/berths" element={<BerthManage />} />
        <Route path="/illegal-behavior" element={<IllegalBehavior />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/report-center" element={<ReportCenter />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/model-center" element={<ModelCenter />} />
        <Route path="/data-annotation" element={<DataAnnotation />} />
        <Route path="/system-logs" element={<SystemLogs />} />
      </Routes>
    </Layout>
  );
}

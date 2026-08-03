import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import Login from './pages/Login';
import { Navigate, useLocation } from 'react-router-dom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/early-warning" element={
        <PrivateRoute>
          <Layout>
            <EarlyWarning />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/early-warning/power-velocity" element={
        <PrivateRoute>
          <Layout>
            <PowerVelocity />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/early-warning/berths-monitor" element={
        <PrivateRoute>
          <Layout>
            <BerthsMonitor />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/early-warning/bridge-monitor" element={
        <PrivateRoute>
          <Layout>
            <BridgeMonitor />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/ship-scheduling/submit" element={
        <PrivateRoute>
          <Layout>
            <UpstreamSubmit />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/ship-scheduling/consolidate" element={
        <PrivateRoute>
          <Layout>
            <ConsolidateManage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/ship-scheduling/berths" element={
        <PrivateRoute>
          <Layout>
            <BerthManage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/illegal-behavior" element={
        <PrivateRoute>
          <Layout>
            <IllegalBehavior />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/ai-assistant" element={
        <PrivateRoute>
          <Layout>
            <AIAssistant />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/report-center" element={
        <PrivateRoute>
          <Layout>
            <ReportCenter />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/knowledge-base" element={
        <PrivateRoute>
          <Layout>
            <KnowledgeBase />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/model-center" element={
        <PrivateRoute>
          <Layout>
            <ModelCenter />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/data-annotation" element={
        <PrivateRoute>
          <Layout>
            <DataAnnotation />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/system-logs" element={
        <PrivateRoute>
          <Layout>
            <SystemLogs />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

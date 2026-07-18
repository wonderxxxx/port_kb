import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from "@/pages/Home";
import KnowledgeSearch from "@/pages/KnowledgeSearch";
import KnowledgeManagement from "@/pages/KnowledgeManagement";

function Navbar() {
  const navigate = useNavigate();
  const tabs = [
    { path: "/", label: "业务问答" },
    { path: "/search", label: "知识检索" },
    { path: "/management", label: "知识库管理" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-900">智能问答助手</h1>
            <span className="text-xs text-slate-500">港航业务智能问答 · 语音输入 · AI播报 · 好评率 100%</span>
          </div>
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  window.location.pathname === tab.path
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<KnowledgeSearch />} />
        <Route path="/management" element={<KnowledgeManagement />} />
      </Routes>
    </Router>
  );
}

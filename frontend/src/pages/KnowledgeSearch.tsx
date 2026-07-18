import { useState } from "react";
import axios from "axios";
import { Search, BookOpen, FileText } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

interface SearchResult {
  id: number;
  document_id: number;
  document_name: string;
  chunk_text: string;
  score: number;
}

interface QAResponse {
  answer: string;
  sources: SearchResult[];
}

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [qaResponse, setQaResponse] = useState<QAResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const qaRes = await axios.post(`${API_BASE}/qa/`, {
        query: searchQuery,
        top_k: 5,
      });
      setQaResponse(qaRes.data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const sources = qaResponse?.sources ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex space-x-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入检索关键词..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Search className="h-5 w-5" />
              <span>{loading ? "检索中..." : "检索"}</span>
            </button>
          </div>
        </div>

        {qaResponse && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-blue-600 font-medium">AI</span>
              <span className="text-slate-500 text-sm">Q: {searchQuery}</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{qaResponse.answer}</p>
              <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
                <span>来源：知识库 · 向量检索</span>
              </div>
            </div>
          </div>
        )}

        {qaResponse && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              参考来源
            </h2>
            {sources.length > 0 ? (
              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div
                    key={source.id ?? index}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-blue-600">{source.document_name}</h3>
                      <span className="text-xs text-slate-400">
                        相关度: {(source.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{source.chunk_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>暂无参考来源</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

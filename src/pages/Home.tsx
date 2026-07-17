import { useState } from "react";
import axios from "axios";
import { Upload, FileText, Search, MessageCircle, Trash2, BookOpen, File } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

interface Document {
  id: number;
  filename: string;
  filepath: string;
  file_type: string;
  created_at: string;
  updated_at: string | null;
}

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

type SearchType = "vector" | "keyword" | "hybrid";

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchType, setSearchType] = useState<SearchType>("hybrid");
  const [qaQuery, setQaQuery] = useState("");
  const [qaResponse, setQaResponse] = useState<QAResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus("正在上传文件...");
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadStatus("正在提取文本内容...");
      
      await axios.post(`${API_BASE}/documents/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          if (percentCompleted < 100) {
            setUploadStatus(`正在上传文件... ${percentCompleted}%`);
          }
        },
      });
      
      setUploadStatus("正在处理文档...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      await fetchDocuments();
      setUploadStatus("上传完成！");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("上传失败");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个文档吗？")) return;
    try {
      await axios.delete(`${API_BASE}/documents/${id}`);
      fetchDocuments();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/search/${searchType}`, {
        query: searchQuery,
        top_k: 5,
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQA = async () => {
    if (!qaQuery.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/qa/`, {
        query: qaQuery,
        top_k: 5,
      });
      setQaResponse(response.data);
    } catch (error) {
      console.error("QA failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">知识库系统</h1>
                <p className="text-sm text-slate-500">智能文档管理与问答</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                上传文档
              </h2>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.md,.txt"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="p-4 bg-blue-50 rounded-full">
                    {uploading ? (
                      <div className="animate-spin">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <FileText className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <span className="text-slate-700 font-medium">
                    {uploading ? "上传中..." : "点击或拖拽文件到此处"}
                  </span>
                  <span className="text-sm text-slate-500">
                    支持 PDF、DOCX、MD、TXT 格式
                  </span>
                </label>
                {uploadStatus && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="h-2 flex-1 max-w-xs bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          uploadStatus.includes("完成") ? "bg-green-500" : 
                          uploadStatus.includes("失败") ? "bg-red-500" : "bg-blue-500"
                        }`}
                        style={{ width: uploadStatus.includes("完成") ? "100%" : 
                                uploadStatus.includes("失败") ? "100%" : "70%" }}
                      ></div>
                    </div>
                  </div>
                )}
                {uploadStatus && (
                  <p className={`mt-2 text-sm ${
                    uploadStatus.includes("完成") ? "text-green-600" : 
                    uploadStatus.includes("失败") ? "text-red-600" : "text-blue-600"
                  }`}>
                    {uploadStatus}
                  </p>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                搜索文档
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="输入搜索关键词..."
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "搜索中..." : "搜索"}
                  </button>
                </div>
                <div className="flex gap-2">
                  {([
                    { value: "vector", label: "语义搜索" },
                    { value: "keyword", label: "关键词搜索" },
                    { value: "hybrid", label: "混合搜索" },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSearchType(option.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        searchType === option.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-300 hover:border-blue-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-700">搜索结果</h3>
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            {result.document_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            相似度: {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {result.chunk_text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                AI 问答
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qaQuery}
                    onChange={(e) => setQaQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQA()}
                    placeholder="输入您的问题..."
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleQA}
                    disabled={loading || !qaQuery.trim()}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "思考中..." : "提问"}
                  </button>
                </div>
                {qaResponse && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="text-sm font-medium text-green-700 mb-2">AI 回答</h3>
                      <p className="text-slate-700">{qaResponse.answer}</p>
                    </div>
                    {qaResponse.sources.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-2">参考来源</h3>
                        {qaResponse.sources.map((source) => (
                          <div
                            key={source.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2"
                          >
                            <span className="text-sm font-medium text-blue-600">
                              {source.document_name}
                            </span>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {source.chunk_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <File className="h-5 w-5 mr-2 text-blue-600" />
                文档列表
              </h2>
              <button
                onClick={fetchDocuments}
                className="w-full mb-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
              >
                刷新列表
              </button>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无文档</p>
                  <p className="text-sm">上传文档开始使用</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {doc.filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {doc.file_type.toUpperCase()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

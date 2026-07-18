import { useState, useEffect } from "react";
import axios from "axios";
import { Upload, FileText, Search, Edit2, Trash2, Download, Plus } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

interface Document {
  id: number;
  filename: string;
  filepath: string;
  file_type: string;
  created_at: string;
  updated_at: string | null;
}

export default function KnowledgeManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  // 页面加载时从后端拉取真实文档列表
  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus("正在上传文件...");
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE}/documents/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus("上传完成！");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      fetchDocuments();
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
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    return (
      searchQuery === "" ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">知识库管理</h1>
            <p className="text-sm text-slate-500">法规/案例/规范/标准的录入、审核、检索 — 为智能问答提供知识底座</p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="h-4 w-4" />
              <span>导出 CSV</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>新增条目</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件名..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".pdf,.docx,.md,.txt,.html,.xml"
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
                  <Upload className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <span className="text-slate-700 font-medium">
                {uploading ? "上传中..." : "拖拽文件到此处上传，或点击选择文件"}
              </span>
              <span className="text-sm text-slate-500">
                支持 Word (.docx) · Markdown (.md) · PDF · TXT · HTML · XML
              </span>
              <span className="text-xs text-slate-400">
                文件自动解析为段落，最大 10MB
              </span>
            </label>
            {uploadStatus && (
              <p className={`mt-4 text-sm ${uploadStatus.includes("完成") ? "text-green-600" : uploadStatus.includes("失败") ? "text-red-600" : "text-blue-600"}`}>
                {uploadStatus}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {doc.file_type}
                      </span>
                      <span className="text-xs text-slate-400">上传时间: {doc.created_at}</span>
                    </div>
                    <h3 className="text-base font-medium text-slate-900 mb-1">{doc.filename}</h3>
                    {doc.filepath && (
                      <p className="text-sm text-slate-500 break-all">{doc.filepath}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>暂无文档</p>
              <p className="text-sm">上传文档开始使用</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

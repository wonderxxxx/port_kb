import { useState, useEffect } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { IconSearch, IconCheck, IconWarning, IconDocument, IconX, IconList } from '../components/Icons';
import { API_BASE } from '../lib/api';

interface KnowledgeEntry { id:string;title:string;category:string;content:string;tags:string[];status:string;author:string;createdAt:string;updatedAt:string;fileName?:string;fileType?:string;fileSize?:string }
const SUPPORTED_TYPES = '.txt,.md,.csv,.pdf,.doc,.docx,.html,.json,.xml';

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [allEntries, setAllEntries] = useState<KnowledgeEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [editEntry, setEditEntry] = useState<Partial<KnowledgeEntry>|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const formatSize = (bytes:number) => bytes<1024?bytes+'B':bytes<1048576?(bytes/1024).toFixed(1)+'KB':(bytes/1048576).toFixed(1)+'MB';

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    let count = 0;
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`${API_BASE}/documents/upload`, {
          method:'POST', body: formData,
        });
        count++;
      } catch { addToast(`${file.name} 上传失败`,'error'); }
    }
    setUploading(false);
    setDragOver(false);
    if (count>0) { addToast(`成功上传 ${count} 个文件`); fetchEntries(); }
  };

  const fetchEntries = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const docs = await res.json();
      const newEntries: KnowledgeEntry[] = docs.map((doc:any) => ({
        id: String(doc.id),
        title: doc.filename,
        category: doc.file_type || '法规',
        content: doc.filepath || '',
        tags: [doc.file_type?.toUpperCase() || ''],
        status: 'published',
        author: '系统',
        createdAt: doc.created_at || '',
        updatedAt: doc.updated_at || '',
        fileName: doc.filename,
        fileType: doc.file_type,
      }));
      setAllEntries(newEntries);
      setEntries(newEntries);
      const cats = [...new Set(newEntries.map(e => e.category))];
      setCategories(cats);
    } catch {
      addToast('获取文档列表失败','error');
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSearch = () => {
    const filtered = allEntries.filter(e =>
      (filterCat === 'all' || e.category === filterCat) &&
      (filterStatus === 'all' || e.status === filterStatus) &&
      (keyword === '' || e.title.toLowerCase().includes(keyword.toLowerCase()) || e.content.toLowerCase().includes(keyword.toLowerCase()))
    );
    setEntries(filtered);
  };

  const handleSave = async () => {
    if (!editEntry?.title?.trim()) { addToast('请输入标题','warning'); return; }
    if (editEntry.id) {
      addToast('编辑功能暂未实现');
    } else {
      addToast('新增条目功能暂未实现');
    }
    setShowForm(false); setEditEntry(null); fetchEntries();
  };

  const handleDelete = async (id:string) => {
    if (!confirm('确认删除？')) return;
    try {
      await fetch(`${API_BASE}/documents/${id}`, { method:'DELETE' });
      addToast('已删除'); fetchEntries();
    } catch {
      addToast('删除失败','error');
    }
  };

  const handleReview = async (id:string, status:string) => {
    addToast(status==='published'?'已发布':'已审核');
    fetchEntries();
  };

  const handleEdit = (entry:KnowledgeEntry) => {
    setEditEntry(entry); setShowForm(true);
  };

  const statusColor = (s:string) => s==='published'?'text-emerald-600':s==='review'?'text-amber-500':s==='draft'?'text-slate-400':'text-red-500';

  return (
    <div className="space-y-6">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">知识库管理</h2><p className="text-sm text-slate-500 mt-1">法规/案例/预案/标准的录入、审核、检索 — 为智能问答提供知识底座</p></div>
        <div className="flex items-center gap-2">
          <button onClick={()=>{
            const csv = 'title,category,content,tags\n'+entries.map(e=>`"${e.title}","${e.category}","${e.content}","${e.tags.join(';')}"`).join('\n');
            const blob = new Blob(['﻿'+csv],{type:'text/csv'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');a.href=url;a.download='知识库导出.csv';a.click();
            URL.revokeObjectURL(url);addToast('已导出 CSV');
          }} className="px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">导出 CSV</button>
          <button onClick={()=>{setEditEntry({title:'',category:'法规',content:'',tags:[],status:'draft'});setShowForm(true)}}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">+ 新增条目</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-sm">
            <option value="all">全部分类</option>
            {categories.map(c=>(<option key={c} value={c}>{c}</option>))}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-sm">
            <option value="all">全部状态</option>
            <option value="published">已发布</option><option value="draft">草稿</option><option value="review">审核中</option>
          </select>
          <input value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} placeholder="搜索标题/内容/标签..."
            className="px-3 py-1.5 border border-slate-200 rounded text-sm flex-1 max-w-[300px]"/>
          <button onClick={handleSearch} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-1"><IconSearch className="w-3.5 h-3.5"/> 搜索</button>
        </div>
      </div>

      {/* File upload zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files)}}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          dragOver?'border-blue-400 bg-blue-50':'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
        }`}
        onClick={()=>document.getElementById('file-upload')?.click()}
      >
        <input id="file-upload" type="file" multiple accept={SUPPORTED_TYPES}
          onChange={e=>e.target.files&&handleFiles(e.target.files)} className="hidden"/>
        {uploading ? (
          <div className="text-sm text-blue-500">正在上传解析文件...</div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 font-medium">拖拽文件到此处上传，或点击选择文件</p>
            <p className="text-xs text-slate-400 mt-1">支持 Word (.doc/.docx) · Markdown (.md) · TXT · PDF · CSV · HTML · JSON · XML</p>
            <p className="text-xs text-slate-400">文件自动解析为知识条目，最大 10MB</p>
          </div>
        )}
      </div>

      {/* Entry list */}
      <div className="space-y-3">
        {entries.map(e=>(
          <div key={e.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{e.category}</span>
                  {e.fileName && <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full flex items-center gap-1">
                    <IconDocument className="w-3 h-3"/>{e.fileType?.toUpperCase()} {e.fileSize}
                  </span>}
                  <span className={`text-xs font-medium ${statusColor(e.status)}`}>
                    {e.status==='published'?'✓ 已发布':e.status==='review'?'⏳ 审核中':e.status==='draft'?'📝 草稿':'❌ 已驳回'}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800">{e.title}</h4>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{e.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  {e.tags.map((t,i)=>(<span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{t}</span>))}
                  <span className="text-[10px] text-slate-400 ml-auto">{e.author} · {e.updatedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                <button onClick={()=>handleEdit(e)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">编辑</button>
                {e.status!=='published' && <button onClick={()=>handleReview(e.id,'published')} className="px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded">发布</button>}
                <button onClick={()=>handleDelete(e.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded">删除</button>
              </div>
            </div>
          </div>
        ))}
        {entries.length===0 && <div className="text-center py-12 text-slate-400">暂无匹配的知识条目</div>}
      </div>

      {/* Entry form modal */}
      {showForm && editEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{editEntry.id ? '编辑' : '新增'}知识条目</h3>
            <div className="space-y-3">
              <div><label className="text-sm text-slate-500">标题*</label><input value={editEntry.title||''} onChange={e=>setEditEntry({...editEntry,title:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"/></div>
              <div><label className="text-sm text-slate-500">分类</label>
                <select value={editEntry.category||'法规'} onChange={e=>setEditEntry({...editEntry,category:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {categories.map(c=>(<option key={c} value={c}>{c}</option>))}
                </select></div>
              <div><label className="text-sm text-slate-500">内容</label><textarea value={editEntry.content||''} onChange={e=>setEditEntry({...editEntry,content:e.target.value})} rows={5} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400"/></div>
              <div><label className="text-sm text-slate-500">标签（逗号分隔）</label><input value={(editEntry.tags||[]).join(',')} onChange={e=>setEditEntry({...editEntry,tags:e.target.value.split(',')})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="航行, 桥区, 安全"/></div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={()=>{setShowForm(false);setEditEntry(null)}} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

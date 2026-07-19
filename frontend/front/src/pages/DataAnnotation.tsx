import { useState, useEffect, useRef, useCallback } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

// --- Types ---
interface AnnoTask { id:string;name:string;type:string;total:number;completed:number;annotators:number;status:string;dataset:string;created:string;deadline:string;images?:{name:string;url:string;size:string}[] }
interface AnnoBox { id:number; label:string; x:number;y:number;w:number;h:number; color:string }
interface AnnoStats { totalSamples:number;annotated:number;pending:number;inProgress:number;annotators:number;tasksActive:number;byLabel:{label:string;count:number}[];trend:{date:string;count:number}[] }

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const LABELS = ['货船','集装箱船','散货船','油船','化学品船','工程船','客船','渔船','拖船','砂石船'];
const LABEL_COLORS: Record<string,string> = {货船:'#3b82f6',集装箱船:'#10b981',散货船:'#f59e0b',油船:'#ef4444',化学品船:'#8b5cf6',工程船:'#ec4899',客船:'#06b6d4',渔船:'#84cc16',拖船:'#f97316',砂石船:'#6366f1'};

const tasks: AnnoTask[] = [
  { id:'ANN001',name:'船舶类型标注(6月批次)',type:'图片分类',total:2500,completed:1850,annotators:3,status:'in-progress',dataset:'ship-classification-jun',created:'2026-06-01',deadline:'2026-06-30'},
  { id:'ANN002',name:'异常行为标注-桥区越界',type:'视频标注',total:800,completed:800,annotators:4,status:'completed',dataset:'bridge-violation',created:'2026-06-05',deadline:'2026-06-20'},
  { id:'ANN003',name:'吃水线标注',type:'图片分割',total:1200,completed:320,annotators:2,status:'in-progress',dataset:'waterline-seg',created:'2026-06-10',deadline:'2026-07-10'},
  { id:'ANN004',name:'夜间船舶标注',type:'图片标注',total:1500,completed:0,annotators:0,status:'pending',dataset:'night-ship-det',created:'2026-06-17',deadline:'2026-07-17'},
];

const stats: AnnoStats = {
  totalSamples:6000,annotated:4200,pending:1500,inProgress:300,annotators:5,tasksActive:3,
  byLabel:[{label:'货船',count:1850},{label:'集装箱船',count:620},{label:'工程船',count:480},{label:'客船',count:350},{label:'危险品船',count:280},{label:'渔船',count:180},{label:'桥区越界',count:800},{label:'超速',count:420}],
  trend:[{date:'06-11',count:180},{date:'06-12',count:220},{date:'06-13',count:310},{date:'06-14',count:280},{date:'06-15',count:350},{date:'06-16',count:420},{date:'06-17',count:150}],
};

export default function DataAnnotation() {
  const [tab, setTab] = useState<'tasks'|'label'|'stats'>('tasks');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">数据标注</h2>
        <p className="text-sm text-slate-500 mt-1">图片/视频标注 · 行为异常分析样本 · 模型训练数据准备</p>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[{k:'tasks',l:'标注任务'},{k:'label',l:'图片标注'},{k:'stats',l:'标注统计'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as typeof tab)} className={`px-4 py-2 rounded-md text-sm font-medium ${tab===t.k?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>{t.l}</button>))}
      </div>
      {tab==='tasks'&&<TasksPanel/>}
      {tab==='label'&&<LabelCanvas tasks={tasks}/>}
      {tab==='stats'&&<StatsPanel/>}
    </div>
  );
}

// --- Tasks List ---
function TasksPanel() {
  const [taskList, setTaskList] = useState<AnnoTask[]>(tasks);
  const [editing, setEditing] = useState<AnnoTask|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const emptyTask = (): AnnoTask => ({
    id:'',name:'',type:'图片标注',total:0,completed:0,annotators:0,status:'pending',dataset:'',created:new Date().toISOString().slice(0,10),deadline:'',images:[],
  });

  const handleImageFiles = (files: File[]) => {
    const imgs = files.map(f=>({
      name:f.name, url:URL.createObjectURL(f), size:f.size>1024*1024?(f.size/1024/1024).toFixed(1)+'MB':(f.size/1024).toFixed(0)+'KB',
    }));
    setEditing(p=>p?{...p,images:[...(p.images||[]),...imgs],total:(p.total||0)+files.length}:null);
    addToast(`已添加 ${files.length} 张图片`);
  };

  const handleSave = () => {
    if (!editing?.name.trim()) { addToast('请输入任务名称','warning'); return; }
    if (editing.id) {
      setTaskList(p=>p.map(t=>t.id===editing.id?editing:t));
      addToast('任务已更新');
    } else {
      const t = {...editing, id:'ANN'+Date.now(), completed:0, status:'pending'};
      setTaskList(p=>[...p,t]);
      addToast('任务已创建');
    }
    setShowForm(false); setEditing(null);
  };

  const handleDelete = (id:string) => {
    if (!confirm('删除此标注任务？')) return;
    setTaskList(p=>p.filter(t=>t.id!==id));
    addToast('已删除');
  };

  return (
    <div className="space-y-4">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}
      <button onClick={()=>{setEditing(emptyTask());setShowForm(true)}}
        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 font-medium">+ 新建任务</button>

      {taskList.map(t=>(
        <div key={t.id} className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1"><h4 className="font-semibold">{t.name}</h4><StatusTag status={t.status==='in-progress'?'生效中':t.status==='completed'?'已完成':'待审核'}/></div>
              <p className="text-xs text-slate-500 mb-2">{t.type} · {t.dataset} · {t.annotators}人标注 · {(t.images?.length||t.total)>0?<span>{t.images?.length||t.total} 张图片</span>:<span className="text-amber-500">未上传图片</span>}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-[300px]"><div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width:`${t.total>0?(t.completed/t.total)*100:0}%`}}/></div></div>
                <span className="text-sm font-medium">{t.completed}/{t.total}</span>
                <span className="text-xs text-slate-400">截止 {t.deadline||'—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <button onClick={()=>{setEditing({...t});setShowForm(true)}} className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100">编辑</button>
              <button onClick={()=>handleDelete(t.id)} className="px-3 py-1.5 text-xs text-red-500 bg-red-50 rounded hover:bg-red-100">删除</button>
            </div>
          </div>
        </div>
      ))}
      {taskList.length===0 && <p className="text-center py-8 text-slate-400 text-sm">暂无标注任务</p>}

      {/* Task form modal */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[480px] max-w-[95vw]">
            <h3 className="text-lg font-bold mb-4">{editing.id?'编辑任务':'新建任务'}</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-slate-500 block mb-1">任务名称 *</label><input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如：船舶类型标注(7月批次)"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">标注类型</label><select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option>图片分类</option><option>图片标注</option><option>图片分割</option><option>视频标注</option><option>文本标注</option></select></div>
                <div><label className="text-xs text-slate-500 block mb-1">数据集名称</label><input value={editing.dataset} onChange={e=>setEditing({...editing,dataset:e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="ship-det-v5"/></div>
                <div><label className="text-xs text-slate-500 block mb-1">样本总数</label><input type="number" value={editing.total||''} onChange={e=>setEditing({...editing,total:Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
                <div><label className="text-xs text-slate-500 block mb-1">标注员数</label><input type="number" value={editing.annotators||''} onChange={e=>setEditing({...editing,annotators:Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
                <div><label className="text-xs text-slate-500 block mb-1">截止日期</label><input type="date" value={editing.deadline} onChange={e=>setEditing({...editing,deadline:e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
                <div><label className="text-xs text-slate-500 block mb-1">状态</label><select value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="pending">待开始</option><option value="in-progress">进行中</option><option value="completed">已完成</option></select></div>
              </div>
              {/* Image upload */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">上传图片数据集</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-300 transition-colors cursor-pointer"
                  onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const files=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));handleImageFiles(files);}}>
                  <input type="file" multiple accept="image/*" onChange={e=>e.target.files&&handleImageFiles(Array.from(e.target.files))} className="hidden" id="img-upload"/>
                  <label htmlFor="img-upload" className="cursor-pointer">
                    <p className="text-sm text-slate-500">拖拽图片到此处，或<span className="text-blue-500">点击选择文件</span></p>
                    <p className="text-xs text-slate-400 mt-1">支持 JPG/PNG/WebP，可多选或批量拖拽</p>
                  </label>
                </div>
                {editing.images && editing.images.length>0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">{editing.images.length} 张图片：</span>
                    {editing.images.slice(0,8).map((img,i)=>(
                      <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{img.name}</span>
                    ))}
                    {editing.images.length>8 && <span className="text-xs text-slate-400">+{editing.images.length-8} 张</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={()=>{setShowForm(false);setEditing(null)}} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Stats ---
function StatsPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center"><p className="text-xs text-slate-400">样本总数</p><p className="text-2xl font-bold">{stats.totalSamples}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400">已标注</p><p className="text-2xl font-bold text-emerald-600">{stats.annotated}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400">待标注</p><p className="text-2xl font-bold text-amber-500">{stats.pending}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400">标注员</p><p className="text-2xl font-bold text-blue-600">{stats.annotators}</p></div>
        <div className="card text-center"><p className="text-xs text-slate-400">活跃任务</p><p className="text-2xl font-bold text-purple-600">{stats.tasksActive}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="card"><h4 className="card-title">标注类型分布</h4>
          <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={stats.byLabel} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={({label,count})=>`${label}:${count}`}>{stats.byLabel.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </div>
        <div className="card"><h4 className="card-title">每日标注量</h4>
          <ResponsiveContainer width="100%" height={300}><BarChart data={stats.trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- Canvas Label Tool (like LabelImg) ---
function LabelCanvas({ tasks }: { tasks: AnnoTask[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<AnnoBox[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('货船');
  const [selectedBox, setSelectedBox] = useState<number|null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<HTMLImageElement|null>(null);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const drawing = useRef(false);
  const startPos = useRef({x:0,y:0});
  const imgPos = useRef({x:0,y:0,w:0,h:0});
  const scale = useRef(1);

  const selectedTask = tasks.find(t=>t.id===selectedTaskId);
  const taskImages = selectedTask?.images || [];
  const fallbackNames = ['ship_dock_01.jpg','ship_bridge_02.jpg','ship_night_03.jpg','ship_rain_04.jpg'];
  const totalImages = taskImages.length>0 ? taskImages.length : fallbackNames.length;

  // Load current image
  useEffect(()=>{
    if (taskImages.length>0 && taskImages[imageIndex]) {
      const img = new Image();
      img.src = taskImages[imageIndex].url;
      img.onload = ()=>setCurrentImage(img);
      setCurrentImage(null);
    } else {
      setCurrentImage(null);
    }
  },[taskImages,imageIndex]);

  // Draw
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    // Background
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0,0,w,h);

    const margin = 40;
    const iw = w - margin*2, ih = h - margin*2;
    imgPos.current = {x:margin,y:margin,w:iw,h:ih};
    scale.current = iw/800;

    // Draw uploaded image or simulated background
    if (currentImage) {
      const imgScale = Math.min(iw/currentImage.width, ih/currentImage.height);
      const dw = currentImage.width*imgScale, dh = currentImage.height*imgScale;
      const dx = margin+(iw-dw)/2, dy = margin+(ih-dh)/2;
      ctx.drawImage(currentImage,dx,dy,dw,dh);
      scale.current = dw/currentImage.width;
      imgPos.current = {x:dx,y:dy,w:dw,h:dh};
    } else {
      // Water-like gradient background (fallback)
      const grad = ctx.createLinearGradient(margin,margin,margin,ih+margin);
      grad.addColorStop(0,'#475569'); grad.addColorStop(0.3,'#1e3a5f'); grad.addColorStop(0.6,'#0f2b47'); grad.addColorStop(1,'#1e3a5f');
      ctx.fillStyle = grad; ctx.fillRect(margin,margin,iw,ih);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      for (let x=margin;x<=margin+iw;x+=40) { ctx.beginPath(); ctx.moveTo(x,margin); ctx.lineTo(x,margin+ih); ctx.stroke(); }
      for (let y=margin;y<=margin+ih;y+=40) { ctx.beginPath(); ctx.moveTo(margin,y); ctx.lineTo(margin+iw,y); ctx.stroke(); }

      // Simulated ships as dark rectangles
      const ships = [{x:100,y:150,w:120,h:40},{x:350,y:220,w:80,h:30},{x:520,y:100,w:160,h:50},{x:200,y:300,w:100,h:35},{x:600,y:350,w:140,h:45}];
      ships.forEach(s=>{
        const sx = margin+s.x*scale.current, sy = margin+s.y*scale.current, sw = s.w*scale.current, sh = s.h*scale.current;
        ctx.fillStyle = '#334155'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
        ctx.fillRect(sx,sy,sw,sh); ctx.strokeRect(sx,sy,sw,sh);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(sx+sw*0.3,sy-8,sw*0.4,6);
      });

      // Shoreline
      ctx.fillStyle = '#475569'; ctx.fillRect(margin,margin,iw,15);
      ctx.fillStyle = '#334155'; ctx.fillRect(margin,ih+margin-20,iw,20);
    }
    const grad = ctx.createLinearGradient(margin,margin,margin,ih+margin);
    grad.addColorStop(0,'#475569'); grad.addColorStop(0.3,'#1e3a5f'); grad.addColorStop(0.6,'#0f2b47'); grad.addColorStop(1,'#1e3a5f');
    ctx.fillStyle = grad; ctx.fillRect(margin,margin,iw,ih);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let x=margin;x<=margin+iw;x+=40) { ctx.beginPath(); ctx.moveTo(x,margin); ctx.lineTo(x,margin+ih); ctx.stroke(); }
    for (let y=margin;y<=margin+ih;y+=40) { ctx.beginPath(); ctx.moveTo(margin,y); ctx.lineTo(margin+iw,y); ctx.stroke(); }

    // Simulated ships as dark rectangles
    const ships = [{x:100,y:150,w:120,h:40},{x:350,y:220,w:80,h:30},{x:520,y:100,w:160,h:50},{x:200,y:300,w:100,h:35},{x:600,y:350,w:140,h:45}];
    ships.forEach(s=>{
      const sx = margin+s.x*scale.current, sy = margin+s.y*scale.current, sw = s.w*scale.current, sh = s.h*scale.current;
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
      ctx.fillRect(sx,sy,sw,sh); ctx.strokeRect(sx,sy,sw,sh);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(sx+sw*0.3,sy-8,sw*0.4,6);
    });

    // Shoreline at top
    ctx.fillStyle = '#475569'; ctx.fillRect(margin,margin,iw,15);
    ctx.fillStyle = '#334155'; ctx.fillRect(margin,ih+margin-20,iw,20);

    // Annotation boxes
    boxes.forEach((b,idx)=>{
      const bx = margin+b.x*scale.current, by = margin+b.y*scale.current, bw = b.w*scale.current, bh = b.h*scale.current;
      const color = LABEL_COLORS[b.label]||'#3b82f6';
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.strokeRect(bx,by,bw,bh);
      // Handle corners
      ctx.fillStyle = color;
      [{x:bx-3,y:by-3},{x:bx+bw-3,y:by-3},{x:bx-3,y:by+bh-3},{x:bx+bw-3,y:by+bh-3}].forEach(p=>ctx.fillRect(p.x,p.y,6,6));
      // Label background
      const label = `${idx+1}. ${b.label}`;
      ctx.font = 'bold 11px monospace';
      const tm = ctx.measureText(label);
      ctx.fillStyle = color+'dd';
      ctx.fillRect(bx,by-20,tm.width+8,18);
      ctx.fillStyle = '#fff';
      ctx.fillText(label,bx+4,by-6);
      // Selected highlight
      if (idx===selectedBox) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([4,4]);
        ctx.strokeRect(bx-2,by-2,bw+4,bh+4); ctx.setLineDash([]);
      }
    });

    // Border
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.strokeRect(margin,margin,iw,ih);
    // Info text
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif';
    const label = taskImages.length>0?taskImages[imageIndex]?.name:fallbackNames[imageIndex];
    ctx.fillText(`图片 ${imageIndex+1}/${totalImages}  ${label||''}`,margin,margin-8);
    ctx.fillText(`${boxes.length} 个标注框`,margin+iw-80,margin-8);
  },[boxes,selectedBox,imageIndex,currentImage,taskImages]);

  useEffect(()=>{redraw();},[redraw]);

  // Mouse events
  const getImgCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return {x:0,y:0};
    const imgX = (e.clientX-rect.left-imgPos.current.x)/scale.current;
    const imgY = (e.clientY-rect.top-imgPos.current.y)/scale.current;
    return {x:imgX,y:imgY};
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const {x,y} = getImgCoords(e);
    // Check if clicking existing box
    const hit = boxes.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if (hit>=0) { setSelectedBox(hit); return; }
    setSelectedBox(null);
    drawing.current = true;
    startPos.current = {x,y};
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing.current) return;
    redraw();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const {x,y} = getImgCoords(e);
    const sx = imgPos.current.x+startPos.current.x*scale.current, sy = imgPos.current.y+startPos.current.y*scale.current;
    const w = (x-startPos.current.x)*scale.current, h = (y-startPos.current.y)*scale.current;
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
    ctx.strokeRect(sx,sy,w,h); ctx.setLineDash([]);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing.current) return;
    drawing.current = false;
    const {x,y} = getImgCoords(e);
    const w = Math.abs(x-startPos.current.x), h = Math.abs(y-startPos.current.y);
    if (w<5||h<5) return;
    setBoxes(p=>[...p,{
      id:Date.now(),
      label:selectedLabel,
      x:Math.min(x,startPos.current.x), y:Math.min(y,startPos.current.y),
      w,h,
      color:LABEL_COLORS[selectedLabel],
    }]);
    setSaved(false);
  };

  const handleDelete = () => {
    if (selectedBox===null) return;
    setBoxes(p=>p.filter((_,i)=>i!==selectedBox));
    setSelectedBox(null); setSaved(false);
  };

  const handleSave = () => {
    addToast(`已保存：${boxes.length} 个标注框`);
    setSaved(true);
  };

  const handleNext = () => {
    setImageIndex(p=>(p+1)%totalImages);
    setBoxes([]); setSelectedBox(null); setSaved(false);
  };
  const handlePrev = () => {
    setImageIndex(p=>(p-1+totalImages)%totalImages);
    setBoxes([]); setSelectedBox(null); setSaved(false);
  };

  // Keyboard shortcuts
  useEffect(()=>{
    const handler = (e:KeyboardEvent)=>{
      if (e.key==='Delete'||e.key==='Backspace') handleDelete();
      if (e.key==='d'&&e.ctrlKey) { e.preventDefault(); handleNext(); }
      if (e.key==='a'&&e.ctrlKey) { e.preventDefault(); handlePrev(); }
      if (e.key==='s'&&e.ctrlKey) { e.preventDefault(); handleSave(); }
      // Number keys for label selection
      const n = parseInt(e.key);
      if (n>=1&&n<=LABELS.length) setSelectedLabel(LABELS[n-1]);
    };
    window.addEventListener('keydown',handler);
    return ()=>window.removeEventListener('keydown',handler);
  },[selectedBox,boxes]);

  return (
    <div className="space-y-4">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      {/* Toolbar */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">标签:</span>
            {LABELS.map((l,i)=>(
              <button key={l} onClick={()=>setSelectedLabel(l)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedLabel===l?'text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
                style={selectedLabel===l?{backgroundColor:LABEL_COLORS[l],borderColor:LABEL_COLORS[l]}:{}}>
                {i+1}.{l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedTaskId} onChange={e=>{setSelectedTaskId(e.target.value);setImageIndex(0);setBoxes([]);}}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs">
              <option value="">— 选择任务（模拟图片）—</option>
              {tasks.filter(t=>t.images&&t.images.length>0).map(t=><option key={t.id} value={t.id}>{t.name}（{t.images?.length}张）</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-400">{imageIndex+1}/{totalImages}</span>
            <button onClick={handlePrev} className="px-3 py-1.5 bg-slate-100 text-xs rounded hover:bg-slate-200">上一张</button>
            <button onClick={handleNext} className="px-3 py-1.5 bg-slate-100 text-xs rounded hover:bg-slate-200">下一张</button>
            <button onClick={handleDelete} disabled={selectedBox===null} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded hover:bg-red-100 disabled:opacity-30">删除框</button>
            <button onClick={handleSave} className={`px-4 py-1.5 text-xs rounded font-medium ${saved?'bg-emerald-100 text-emerald-600':'bg-blue-500 text-white hover:bg-blue-600'}`}>{saved?'已保存':'保存标注'}</button>
          </div>
        </div>
      </div>

      {/* Canvas + Box list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas */}
        <div className="lg:col-span-3 card p-0 overflow-hidden" ref={containerRef}>
          <canvas ref={canvasRef} width={900} height={550}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
            style={{width:'100%',height:'auto',cursor:'crosshair'}}
          />
        </div>

        {/* Box list */}
        <div className="card">
          <h4 className="font-semibold text-sm mb-2">标注列表 ({boxes.length})</h4>
          {selectedBox!==null && boxes[selectedBox] && (
            <div className="bg-blue-50 rounded-lg p-2 mb-2 text-xs">
              <p className="font-medium">{selectedBox+1}. {boxes[selectedBox].label}</p>
              <p className="text-slate-500">x:{boxes[selectedBox].x.toFixed(0)} y:{boxes[selectedBox].y.toFixed(0)}</p>
              <p className="text-slate-500">宽:{boxes[selectedBox].w.toFixed(0)} 高:{boxes[selectedBox].h.toFixed(0)}</p>
              <label className="text-[10px] text-slate-400 block mt-1">修改标签</label>
              <select value={boxes[selectedBox].label} onChange={e=>{setBoxes(p=>p.map((b,i)=>i===selectedBox?{...b,label:e.target.value,color:LABEL_COLORS[e.target.value]}:b));setSaved(false)}}
                className="w-full px-2 py-1 border rounded text-xs mt-0.5">
                {LABELS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {boxes.map((b,i)=>(
              <div key={b.id} onClick={()=>setSelectedBox(i)}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${i===selectedBox?'bg-blue-100':'hover:bg-slate-50'}`}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor:b.color}}/>
                <span className="font-medium">{i+1}.{b.label}</span>
                <span className="text-slate-400 ml-auto text-[10px]">{(b.w*b.h).toFixed(0)}px²</span>
              </div>
            ))}
            {boxes.length===0 && <p className="text-xs text-slate-400 text-center py-4">点击并拖拽创建标注框</p>}
          </div>

          <div className="mt-4 p-2 bg-slate-50 rounded text-[10px] text-slate-500 space-y-0.5">
            <p><kbd className="px-1 bg-white border rounded">1-9</kbd> 选择标签</p>
            <p><kbd className="px-1 bg-white border rounded">Delete</kbd> 删除选中框</p>
            <p><kbd className="px-1 bg-white border rounded">Ctrl+S</kbd> 保存</p>
            <p><kbd className="px-1 bg-white border rounded">Ctrl+D</kbd> 下一张</p>
            <p><kbd className="px-1 bg-white border rounded">Ctrl+A</kbd> 上一张</p>
          </div>
        </div>
      </div>
    </div>
  );
}

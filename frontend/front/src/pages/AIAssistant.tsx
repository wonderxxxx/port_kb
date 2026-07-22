import { useState, useRef, useEffect } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { IconDocument, IconWarning, IconCheck, IconSearch, IconAnchor, IconPlay, IconPlus, IconTrash2, IconMessageSquare } from '../components/Icons';
import { API_BASE } from '../lib/api';

interface ChatMessage { role: 'user' | 'assistant'; content: string; time: string; feedback?: 'up'|'down'; }
interface SearchResult { type:string;title:string;url:string;time:string;relevance:number }
interface LegalStep { order: number; title: string; description: string; evidenceRequired: boolean; promptQuestion: string; }
interface Conversation { id: number; title: string; created_at: string; updated_at: string; }

const enforcementSteps: LegalStep[] = [
  { order:1, title:'船舶身份确认', description:'核对船舶名称、MMSI、船籍港', evidenceRequired:true, promptQuestion:'请确认船舶登记信息是否与AIS信号一致？' },
  { order:2, title:'违法行为初步认定', description:'判断违法行为类型和适用法规', evidenceRequired:true, promptQuestion:'请确认违法事实及适用法规条款？' },
  { order:3, title:'现场证据采集', description:'拍摄照片/视频，保存AIS轨迹截图', evidenceRequired:true, promptQuestion:'请采集不少于3张现场照片，确认证据清晰有效？' },
  { order:4, title:'当事人陈述记录', description:'询问当事人并记录陈述', evidenceRequired:false, promptQuestion:'请询问当事人事发情况，记录回答内容？' },
  { order:5, title:'违法后果评估', description:'评估影响程度及从重/从轻情节', evidenceRequired:false, promptQuestion:'该行为是否造成实际危害？是否有从重或从轻情节？' },
  { order:6, title:'处罚建议生成', description:'自动生成处罚建议书或不予处罚建议书', evidenceRequired:false, promptQuestion:'系统已生成建议书草稿，请确认或修改？' },
];

const businessKnowledge: Record<string, string> = {
  '水位': '兰溪水文站当前水位 28.65m（警戒 31.00m，危险 33.50m），趋势上涨。龙游水文站 27.20m，衢江阶梯枢纽 26.80m。',
  '船': '当前衢江流域（兰溪-龙游段）共有 15 艘船舶，其中 7 艘航行中、4 艘锚泊、2 艘作业中。',
  '泊位': '龙游锚地 10/15（67%），衢江服务区 14/20（70%），兰溪码头 5/8（63%），姚家闸等区 3/10（30%）。',
  '船闸': '姚家船闸：运行中，排队8艘，下一闸11:30。衢江枢纽船闸：排队5艘。小溪滩船闸：维护中。',
  '暴雨': '已发布暴雨黄色预警，预计12h内有暴雨（52.8mm/24h），局地大暴雨。请做好防汛准备。',
  '泄洪': '衢江阶梯枢纽当前泄洪流量 2200m³/s，预计4h后增至 2800m³/s（黄色预警）。',
  '调度': '今日三区调度申请 32 艘（龙游10、衢江15、兰溪7），未超过40艘上限。',
  '法规': '请切换到「执法辅助」或「知识检索」标签页获取详细法规条款。',
};

function getAnswer(q: string): string {
  const ql = q.toLowerCase();
  if (ql.includes('水位')||ql.includes('水文')) return businessKnowledge['水位'];
  if (ql.includes('几艘')||ql.includes('数量')||ql.includes('多少艘')||(ql.includes('船')&&ql.includes('艘'))) return businessKnowledge['船'];
  if (ql.includes('泊位')||ql.includes('锚地')) return businessKnowledge['泊位'];
  if (ql.includes('船闸')||ql.includes('闸')) return businessKnowledge['船闸'];
  if (ql.includes('暴雨')||ql.includes('雨')||ql.includes('降雨')) return businessKnowledge['暴雨'];
  if (ql.includes('泄洪')||ql.includes('流量')) return businessKnowledge['泄洪'];
  if (ql.includes('调度')||ql.includes('排队')) return businessKnowledge['调度'];
  return `关于「${q.slice(0,30)}」，建议提供更多具体信息。您可切换到「执法辅助」进行流程引导，或「知识检索」查找法规条文。`;
}

export default function AIAssistant() {
  const [tab, setTab] = useState<'chat'|'enforce'|'search'|'cross-modal'>('chat');
  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Voice + TTS
  const [voiceListening, setVoiceListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number|null>(null);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  // Cross-modal
  const [crossQuery, setCrossQuery] = useState('');
  const [crossResults, setCrossResults] = useState<SearchResult[]>([]);
  const [crossLoading, setCrossLoading] = useState(false);
  const [crossDetail, setCrossDetail] = useState<SearchResult|null>(null);
  // Feedback stats
  const [fbStats, setFbStats] = useState<{total:number;up:number;down:number;rate:number}|null>(null);
  useEffect(()=>{fetch('/api/ops/feedback/stats').then(r=>r.json()).then(d=>{if(d.data)setFbStats(d.data)});},[]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Enforcement
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<'处罚建议书'|'不予处罚建议书'>('处罚建议书');
  // Search
  interface RAGSource { id:number; document_id:number; document_name:string; chunk_text:string; score:number }
  const [ragQ, setRagQ] = useState(''); const [ragA, setRagA] = useState(''); const [ragLoading, setRagLoading] = useState(false); const [ragSources, setRagSources] = useState<RAGSource[]>([]);
  // Report
  // Toast
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};
  
  // Conversation management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number|null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  useEffect(()=>{if(tab==='cross-modal')fetchCross();},[tab,crossQuery]);
  useEffect(()=>{fetchConversations();},[]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/qa/conversations`);
      const data = await res.json();
      setConversations(data);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    }
  };

  const createConversation = async () => {
    try {
      const res = await fetch(`${API_BASE}/qa/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新会话' })
      });
      const data = await res.json();
      setConversations(p => [data, ...p]);
      setCurrentConversationId(data.id);
      setMessages([]);
      setSidebarOpen(false);
      addToast('新会话已创建');
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
  };

  const selectConversation = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/qa/conversations/${id}/messages`);
      const data = await res.json();
      setMessages(data.map((m: { role: string; content: string; created_at: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        time: m.created_at
      })));
      setCurrentConversationId(id);
      setSidebarOpen(false);
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个会话吗？')) return;
    try {
      await fetch(`${API_BASE}/qa/conversations/${id}`, { method: 'DELETE' });
      setConversations(p => p.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      addToast('会话已删除');
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  // ---- Chat (with multi-turn context) ----
  const sendMsg = async (text:string)=>{
    const q=text.trim(); if(!q)return;
    const um:ChatMessage={role:'user',content:q,time:new Date().toISOString()};
    setMessages(p=>[...p,um]); setInput(''); setLoading(true);
    let ans='';
    try{
      const r=await fetch(`${API_BASE}/qa/chat`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({query:q,top_k:5,conversation_id:currentConversationId})
      });
      const d=await r.json();
      if(d.answer){
        ans=d.answer;
        if(d.conversation_id && !currentConversationId){
          setCurrentConversationId(d.conversation_id);
          fetchConversations();
        } else {
          fetchConversations();
        }
      }
    }catch{}
    if(!ans)ans=getAnswer(q);
    setTimeout(()=>{setMessages(p=>[...p,{role:'assistant',content:ans,time:new Date().toISOString()}]);setLoading(false);},500);
  };

  // ---- Feedback ----
  const handleFeedback = async (idx:number, rating:'up'|'down') => {
    setMessages(p=>p.map((m,i)=>i===idx?{...m,feedback:rating}:m));
    const msg = messages[idx];
    if(msg) await fetch('/api/ops/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'',answer:msg.content,rating})});
    addToast('反馈已记录');
  };

  // ---- Cross-modal search ----
  const fetchCross = async () => {
    setCrossLoading(true);
    try {
      const res = await fetch('/api/ops/cross-modal/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:crossQuery||'船舶 桥区'})});
      const d = await res.json();
      if (d.data) setCrossResults(d.data);
    } catch {}
    setCrossLoading(false);
  };

  // ---- Voice ASR ----
  const startVoice = async ()=>{
    setVoiceListening(true); addToast('正在收听...');
    setTimeout(async ()=>{
      try{const r=await fetch('/api/ops/voice/asr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});const d=await r.json();if(d.data?.text){setInput(d.data.text);addToast('识别完成');}}catch{addToast('识别失败','error');}
      setVoiceListening(false);
    },2000);
  };

  // ---- Voice TTS (read answer) ----
  const speakAnswer = async (idx:number, text:string)=>{
    if (speakingMsgId === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    setSpeakingMsgId(idx);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = ttsSpeed;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => { setSpeakingMsgId(null); addToast('播报失败','error'); };
    window.speechSynthesis.speak(utterance);
    addToast(`语音播报中(${ttsSpeed}x)...`);
  };

  // ---- Enforcement ----
  const step=enforcementSteps[currentStep];
  const handleNext=()=>{if(currentStep<enforcementSteps.length-1)setCurrentStep(currentStep+1);else genReport();};
  const handleAnswer=(a:string)=>{setAnswers({...answers,[currentStep]:a});handleNext();};
  const genReport=async()=>{try{await fetch('/api/ops/report/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:reportType,shipName:'浙海通008'})});setShowReport(true);addToast('报告生成成功');}catch{addToast('失败','error');}};
  const download=()=>{const c=`${reportType}\n编号：浙港航罚〔2026〕第001号\n当事人：浙江通达航运有限公司\n船舶：浙海通008\n违法：未穿救生衣\n建议：警告+罚款500元`;const b=new Blob([c],{type:'application/msword'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${reportType}.doc`;a.click();URL.revokeObjectURL(u);addToast('已下载');};

  // ---- Search ----
  const doRag=async()=>{if(!ragQ.trim())return;setRagLoading(true);try{const r=await fetch(`${API_BASE}/qa/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:ragQ,top_k:5})});const d=await r.json();setRagA(d.answer||'未找到');setRagSources(d.sources||[]);addToast('检索完成');}catch{addToast('失败','error');}finally{setRagLoading(false);}};

  const tabs=[{k:'chat',l:'业务问答'},{k:'enforce',l:'执法辅助'},{k:'search',l:'知识检索'},{k:'cross-modal',l:'跨模态检索'}] as const;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="md:flex md:items-center md:justify-between">
        <div><h2 className="text-lg font-bold text-slate-800">智能问答助手</h2><p className="text-xs text-slate-500 mt-0.5">港航业务智能问答 · 语音输入 · AI 播报 {fbStats && <span className="text-emerald-500">· 好评率 {fbStats.rate}%</span>}</p></div>
      </div>

      {/* Mobile-friendly tab bar — scrollable */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tab===t.k?'bg-blue-500 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.l}</button>
        ))}
      </div>

      {/* === CHAT TAB (mobile-first chat UI) === */}
      {tab==='chat' && (
        <div className="flex flex-col md:flex-row" style={{minHeight:'calc(100vh - 280px)'}}>
          {/* Sidebar - mobile overlay */}
          <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform ${sidebarOpen?'translate-x-0':'-translate-x-full'} md:relative md:translate-x-0 md:flex-shrink-0`}>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-700">会话列表</h3>
              <button onClick={()=>setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-2">
              <button onClick={createConversation} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <IconPlus className="w-4 h-4" />
                <span>新建会话</span>
              </button>
            </div>
            <div className="overflow-y-auto" style={{height:'calc(100vh - 380px)'}}>
              {conversations.map(c => (
                <div 
                  key={c.id} 
                  onClick={()=>selectConversation(c.id)}
                  className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${currentConversationId === c.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <IconMessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{c.title}</span>
                    </div>
                    <span className="text-[10px] opacity-60">{new Date(c.updated_at).toLocaleString('zh-CN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <button onClick={(e)=>deleteConversation(c.id, e)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <IconMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>暂无会话</p>
                  <p className="text-xs">发送消息后会自动创建会话</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat content */}
          <div className="flex-1 flex flex-col">
            {/* Header with toggle for mobile */}
            <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
              <button onClick={()=>setSidebarOpen(true)} className="flex items-center gap-2 text-slate-600">
                <IconMessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">会话列表</span>
              </button>
              <span className="text-xs text-slate-400">{currentConversationId ? '当前会话' : '新会话'}</span>
            </div>
            
            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto pb-3" style={{maxHeight:'calc(100vh - 380px)'}}>
              {messages.map((m,i)=>(
                <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${m.role==='user'?'bg-blue-500 text-white rounded-br-md':'bg-slate-100 text-slate-700 rounded-bl-md'}`}>
                    {m.role==='assistant'&&<span className="text-[10px] font-bold text-purple-500 block mb-0.5">AI</span>}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] opacity-50">{new Date(m.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span>
                      {m.role==='assistant' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>handleFeedback(i,'up')} className={`text-[10px] px-1 rounded ${m.feedback==='up'?'text-emerald-500':'text-slate-300 hover:text-emerald-500'}`}>👍</button>
                          <button onClick={()=>handleFeedback(i,'down')} className={`text-[10px] px-1 rounded ${m.feedback==='down'?'text-red-500':'text-slate-300 hover:text-red-500'}`}>👎</button>
                          <button onClick={()=>speakAnswer(i,m.content)} className={`text-[10px] flex items-center gap-0.5 ${speakingMsgId===i?'text-purple-500':'text-slate-400 hover:text-purple-500'}`}>
                            <IconPlay className="w-3 h-3"/>{speakingMsgId===i?'播报中':'朗读'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading&&<div className="flex justify-start"><div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5"><span className="text-sm text-slate-400">AI 思考中...</span></div></div>}
              <div ref={chatEndRef}/>
            </div>
            
            {/* Input bar — mobile-optimized */}
            <div className="flex items-end gap-2 bg-white border-t border-slate-100 pt-3 flex-shrink-0">
              <button onClick={startVoice} disabled={voiceListening}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${voiceListening?'bg-red-500 animate-pulse':'bg-slate-100 hover:bg-purple-50'}`}>
                <span className="text-lg">{voiceListening?'🎙':'🎤'}</span>
              </button>
              <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="输入问题，或点击麦克风语音输入..."
                rows={1} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400"
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg(input);}}}/>
              <button onClick={()=>sendMsg(input)} disabled={loading||!input.trim()}
                className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
              </button>
            </div>
            
            {/* TTS speed */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center mt-1">
              <span>朗读语速</span>
              <input type="range" min="0.5" max="2" step="0.1" value={ttsSpeed} onChange={e=>setTtsSpeed(Number(e.target.value))} className="w-16 accent-purple-500"/>
              <span>{ttsSpeed}x</span>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center">Enter 发送 · Shift+Enter 换行 · 🎤 语音输入 · 👍👎 反馈 · 朗读听取回答</p>
          </div>
        </div>
      )}

      {/* === ENFORCEMENT TAB === */}
      {tab==='enforce' && (
        <div className="space-y-4">
          {!showReport?<>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {enforcementSteps.map((s,i)=>(<div key={i} className="flex items-center flex-shrink-0"><button onClick={()=>i<currentStep&&setCurrentStep(i)} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${i<currentStep?'bg-emerald-500 text-white':i===currentStep?'bg-blue-500 text-white ring-2 ring-blue-100':'bg-slate-200 text-slate-400'}`}>{i<currentStep?'✓':i+1}</button>{i<enforcementSteps.length-1&&<div className={`w-3 h-0.5 ${i<currentStep?'bg-emerald-500':'bg-slate-200'}`}/>}</div>))}
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{step.order}</span><h5 className="font-semibold text-sm">{step.title}</h5>{step.evidenceRequired&&<span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">需证据</span>}</div>
              <p className="text-xs text-slate-600 mb-3">{step.description}</p>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2 mb-2"><span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded px-1 py-0.5">AI</span><p className="text-xs font-medium">{step.promptQuestion}</p></div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={()=>handleAnswer('确认无误')} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] rounded-lg hover:bg-emerald-100">&radic; 确认</button>
                  <button onClick={()=>handleAnswer('需核实')} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] rounded-lg hover:bg-amber-100">! 需核实</button>
                  <button onClick={()=>handleAnswer('跳过')} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] rounded-lg hover:bg-slate-200">&raquo; 跳过</button>
                </div>
              </div>
            </div>
            {Object.keys(answers).length>0&&<div className="p-2 bg-slate-50 rounded-lg"><p className="text-[11px] font-semibold text-slate-600 mb-1">已记录</p>{Object.entries(answers).map(([k,v])=>(<div key={k} className="text-[11px] py-0.5"><span className="text-emerald-500">✓{enforcementSteps[Number(k)]?.order}</span> <span className="text-slate-600">{v}</span></div>))}</div>}
            <div className="flex justify-between">
              <button onClick={()=>currentStep>0&&setCurrentStep(currentStep-1)} disabled={currentStep===0} className="px-3 py-1.5 bg-slate-100 text-xs rounded-lg disabled:opacity-30">&larr;</button>
              <div className="flex items-center gap-2">
                <select value={reportType} onChange={e=>setReportType(e.target.value as any)} className="px-2 py-1.5 border border-slate-200 rounded text-xs"><option value="处罚建议书">处罚建议书</option><option value="不予处罚建议书">不予处罚建议书</option></select>
                <button onClick={handleNext} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600">{currentStep<5?'下一步':'生成报告'}</button>
              </div>
            </div>
          </>:<div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs font-mono"><h6 className="text-center font-bold text-sm">{reportType}</h6><p>编号：浙港航罚〔2026〕第001号</p><p>当事人：浙江通达航运有限公司 | 船舶：浙海通008</p><p>违法：未穿救生衣 | 建议：警告+罚款500元</p><p className="text-slate-400 text-center text-[10px]">智能执法辅助系统生成 · 仅供参考</p></div>
            <div className="flex gap-2 mt-3"><button onClick={download} className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs rounded-lg">下载Word</button><button onClick={()=>{setShowReport(false);setCurrentStep(0);setAnswers({});}} className="px-3 py-2 bg-slate-100 text-xs rounded-lg">重新开始</button></div>
          </div>}
        </div>
      )}

      {/* === SEARCH TAB === */}
      {tab==='search' && (
        <div className="space-y-4">
          <div className="flex gap-2"><input value={ragQ} onChange={e=>setRagQ(e.target.value)} placeholder="输入法律问题或业务查询..." className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400" onKeyDown={e=>e.key==='Enter'&&doRag()}/><button onClick={doRag} disabled={ragLoading} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 disabled:opacity-50">{ragLoading?'检索中':'检索'}</button></div>
          {ragA && <div className="bg-white border border-blue-200 rounded-xl p-4"><div className="flex items-start gap-2"><span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded px-1 py-0.5">AI</span><div><p className="text-[11px] text-slate-500 mb-1">Q: {ragQ}</p><p className="text-sm text-slate-700">{ragA}</p><p className="text-[10px] text-slate-400 mt-2">来源: 知识库 · 向量检索</p></div></div></div>}
          {ragSources.length>0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1"><IconDocument className="w-3 h-3"/>参考来源</h4>
              <div className="space-y-2">
                {ragSources.map((s,i)=>(
                  <div key={i} className="p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-blue-600">{s.document_name}</span><span className="text-[10px] text-slate-400">相关度: {(s.score*100).toFixed(1)}%</span></div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{s.chunk_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            {[{t:'《内河交通安全管理条例》',d:'第三章 航行、停泊与作业',k:'救生衣、桥区'},{t:'《浙江省水上交通安全管理办法》',d:'第X章 · 第Y条',k:'桥区水域、追越'},{t:'案例：浙港航罚〔2025〕035号',d:'未穿救生衣 · 金华 · 2025.7',k:'警告+罚款500元'},{t:'案例：浙港航罚〔2025〕102号',d:'桥区追越 · 衢州 · 2025.9',k:'罚款2000元'}].map((a,i)=>(
              <div key={i} onClick={()=>{setRagQ(a.t);doRag();}} className="p-3 bg-slate-50 rounded-lg hover:bg-blue-50 cursor-pointer"><p className="text-sm font-medium">{a.t}</p><p className="text-xs text-slate-500">{a.d} · {a.k}</p></div>
            ))}
          </div>
        </div>
      )}

      {/* === CROSS-MODAL TAB === */}
      {tab==='cross-modal' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={crossQuery} onChange={e=>setCrossQuery(e.target.value)} placeholder="输入描述搜索图片/视频（如：桥区船舶、超载货船）..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              onKeyDown={e=>e.key==='Enter'&&fetchCross()}/>
            <button onClick={fetchCross} disabled={crossLoading} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 disabled:opacity-50">
              {crossLoading?'搜索中...':'跨模态搜索'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {crossResults.map((r,i)=>(
              <div key={i} className="card flex items-start gap-3 hover:border-blue-200 cursor-pointer">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{r.type==='image'?'🖼':r.type==='video'?'🎬':'📄'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.type} · {r.time}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-blue-500">相关度: {(r.relevance*100).toFixed(0)}%</span>
                    <button onClick={()=>setCrossDetail(r)} className="text-xs text-blue-500 hover:underline">查看</button>
                  </div>
                </div>
              </div>
            ))}
            {crossResults.length===0 && <div className="col-span-2 text-center py-8 text-slate-400 text-sm">输入描述后点击搜索，或尝试「桥区」「超载」「船舶」等关键词</div>}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-slate-600">
            <p className="font-medium mb-1">跨模态检索说明</p>
            <p>支持文本搜图片/视频、图片搜相似目标。对接浙港通视频平台、图片库、线索库，检索结果可直接查看原始资料。</p>
          </div>
          {/* Cross-modal detail modal */}
          {crossDetail && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl p-5 w-[500px] max-w-[90vw]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{crossDetail.type==='image'?'🖼':crossDetail.type==='video'?'🎬':'📄'}</span>
                  <div><h4 className="font-bold">{crossDetail.title}</h4><p className="text-xs text-slate-400">{crossDetail.type} · {crossDetail.time} · 相关度 {(crossDetail.relevance*100).toFixed(0)}%</p></div>
                </div>
                <div className="bg-slate-100 rounded-lg h-48 flex items-center justify-center mb-3"><span className="text-slate-400">文件预览区域（生产环境对接平台媒体库）</span></div>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setCrossDetail(null)} className="px-3 py-1.5 bg-slate-100 text-sm rounded">关闭</button>
                  <button onClick={()=>{addToast('已跳转至浙港通平台查看原始文件');setCrossDetail(null);}} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded">在平台中查看</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

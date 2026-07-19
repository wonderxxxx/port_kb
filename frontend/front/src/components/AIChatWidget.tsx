import { useState, useRef, useEffect, useCallback } from 'react';
import { IconPlay } from './Icons';

interface Msg { role:'user'|'assistant'; content:string; time:string }

const biz:Record<string,string> = {
  '水位':'兰溪水位 28.65m（警戒31m），龙游 27.20m，枢纽 26.80m。',
  '船':'辖区15艘船，7艘在航，4艘锚泊。',
  '预警':'当前3条待审核预警：暴雨黄色、泄洪黄色、水位预警。',
  '泊位':'龙游锚地10/15，衢江服务区14/20，兰溪码头5/8。',
};

function answer(q:string):string {
  for(const[k,v] of Object.entries(biz)) if(q.includes(k)) return v;
  return `关于「${q.slice(0,20)}」，建议打开智能问答助手页面获取详细信息。`;
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({x:0,y:0});
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({x:0,y:0,ox:0,oy:0});
  const widgetRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName==='BUTTON'||(e.target as HTMLElement).tagName==='INPUT') return;
    setDragging(true);
    dragStart.current = {x:e.clientX, y:e.clientY, ox:pos.x, oy:pos.y};
  },[pos]);
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setPos({x:dragStart.current.ox+(e.clientX-dragStart.current.x), y:dragStart.current.oy+(e.clientY-dragStart.current.y)});
  },[dragging]);
  const onMouseUp = useCallback(() => setDragging(false),[]);

  useEffect(()=>{
    if (dragging) { window.addEventListener('mousemove',onMouseMove); window.addEventListener('mouseup',onMouseUp); }
    return ()=>{ window.removeEventListener('mousemove',onMouseMove); window.removeEventListener('mouseup',onMouseUp); };
  },[dragging,onMouseMove,onMouseUp]);
  const [msgs, setMsgs] = useState<Msg[]>([{role:'assistant',content:'你好！港航智能助手。可以问我水位、船舶、预警等信息。',time:new Date().toISOString()}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  const send = async (q:string)=>{
    if(!q.trim())return;
    setMsgs(p=>[...p,{role:'user',content:q,time:new Date().toISOString()}]);
    setInput(''); setLoading(true);
    setTimeout(()=>{
      setMsgs(p=>[...p,{role:'assistant',content:answer(q),time:new Date().toISOString()}]);
      setLoading(false);
    },600);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={()=>{setOpen(true);setUnread(0);}}
          onMouseDown={onMouseDown}
          style={{right:24-pos.x,bottom:24-pos.y}}
          className={`fixed z-50 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all flex items-center justify-center group ${dragging?'cursor-grabbing':'cursor-grab'}`}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
          </svg>
          {unread>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
          <span className="absolute -top-8 right-0 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">智能助手</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div ref={widgetRef} onMouseDown={onMouseDown}
          style={{right:24-pos.x,bottom:24-pos.y}}
          className={`fixed z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden ${dragging?'cursor-grabbing select-none':''}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-500 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
              <div><p className="text-sm font-bold">港航智能助手</p><p className="text-[10px] opacity-75">AI 在线 · 语音输入 · 朗读回答</p></div>
            </div>
            <button onClick={()=>setOpen(false)} className="text-white/70 hover:text-white text-lg">&times;</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-slate-50">
            {msgs.map((m,i)=>(
              <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${m.role==='user'?'bg-blue-500 text-white rounded-br-md':'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100'}`}>
                  {m.role==='assistant'&&<span className="text-[9px] font-bold text-purple-500">AI</span>}
                  <p className="leading-relaxed">{m.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] opacity-40">{new Date(m.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span>
                    {m.role==='assistant'&&<button onClick={()=>{/* TTS */}} className="text-[9px] text-slate-400 hover:text-purple-500 flex items-center gap-0.5"><IconPlay className="w-2.5 h-2.5"/>朗读</button>}
                  </div>
                </div>
              </div>
            ))}
            {loading&&<div className="flex justify-start"><div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 text-xs text-slate-400 shadow-sm">AI 思考中...</div></div>}
            <div ref={endRef}/>
          </div>

          {/* Quick buttons */}
          <div className="flex gap-1 px-3 py-2 overflow-x-auto bg-white border-t border-slate-100 flex-shrink-0">
            {['水位','船舶','预警','泊位'].map(q=>(<button key={q} onClick={()=>send(q+'情况')} className="flex-shrink-0 px-2 py-0.5 bg-slate-50 text-[10px] text-slate-500 rounded-full hover:bg-blue-50 hover:text-blue-600 border">{q}</button>))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-slate-100 flex-shrink-0">
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="输入问题..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-blue-400"
              onKeyDown={e=>e.key==='Enter'&&send(input)}/>
            <button onClick={()=>send(input)} disabled={loading||!input.trim()} className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

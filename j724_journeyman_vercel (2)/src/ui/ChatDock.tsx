import React,{useEffect,useRef,useState} from "react"; import { useAppStore } from "../store";
type Msg={role:"user"|"assistant"|"system";content:string;when:number};
export default function ChatDock(){
  const { report,tab } = useAppStore(); const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState<Msg[]>([{role:"assistant",content:"Hi—I'm your AI Travel Mate. Paste a URL to scrape & summarize, or ask about route risks, weather, alerts, FX, time.",when:Date.now()}]);
  const [text,setText]=useState(""); const [busy,setBusy]=useState(false); const tailRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ tailRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,open]);
  const send=async()=>{ const q=text.trim(); if(!q) return; setText(""); setMsgs(m=>[...m,{role:"user",content:q,when:Date.now()}]); setBusy(true);
    try{ const url=(q.match(/https?:\/\/\S+/i)?.[0]||"").replace(/[)\]]+$/,""); let pre=""; if(url){ pre=await scrapeSumm(url); }
      const r=await fetch("/api/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ messages: msgs.concat([{role:"user",content:q,when:Date.now()}]).map(m=>({role:m.role,content:m.content})), context:{tab,report, hint: pre?{scraped:url,snippet:pre}:undefined } })});
      const j=await r.json(); setMsgs(m=>[...m,{role:"assistant",content:j.answer||"…",when:Date.now()}]);
    }catch{ setMsgs(m=>[...m,{role:"assistant",content:"Network error. Try again.",when:Date.now()}]); } finally{ setBusy(false); } };
  async function scrapeSumm(url:string){ try{ const r=await fetch(`/api/scrape?url=${encodeURIComponent(url)}`); const j=await r.json(); const title=j?.meta?.title||url; const text=(j?.html||"").replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g," ").slice(0,600).replace(/\s+/g," ").trim(); return `SCRAPED:\nTitle: ${title}\nPreview: ${text}`; } catch { return ""; } }
  return (<>
    <button onClick={()=>setOpen(v=>!v)} className="fixed bottom-8 right-8 btn bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-2xl no-print rounded-full w-16 h-16 text-2xl">💬</button>
    {open&&(<div className="fixed bottom-28 right-8 w-[min(420px,calc(100vw-2rem))] glass rounded-3xl p-4 z-50 no-print">
      <div className="flex items-center justify-between pb-2"><div className="font-bold text-cyan-300">AI Travel Mate</div><button className="text-sm opacity-70 hover:opacity-100" onClick={()=>setOpen(false)}>Close ✕</button></div>
      <div className="h-80 overflow-y-auto bg-white/5 rounded-2xl p-3 space-y-3">{msgs.map((m,i)=>(<div key={i} className={`text-sm ${m.role==="user"?"text-white":"text-gray-200"}`}><div className={`inline-block px-3 py-2 rounded-2xl ${m.role==="user"?"bg-cyan-600":"bg-white/10"}`}>{m.content}</div></div>))}<div ref={tailRef}/></div>
      <div className="flex gap-2 mt-3"><input className="input flex-1" placeholder="Paste a URL or ask about your route, risks, weather…" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send();}}/><button className={`btn ${busy?"bg-gray-600":"bg-cyan-600"}`} onClick={send} disabled={busy}>{busy?"…":"Send"}</button></div>
      <div className="text-[11px] text-gray-400 mt-2">Scraper & live feeds run server-side; keys never hit the browser.</div>
    </div>)}
  </>);
}

import React,{useEffect,useState} from "react";
type Item={id:string;name:string;tier:"free"|"premium";status:"active"|"partial"|"error";note?:string};
export default function SourcesBadge(){
  const [items,setItems]=useState<Item[]>([]); const [ts,setTs]=useState(0); const [open,setOpen]=useState(false);
  const load=async()=>{ try{ const r=await fetch("/api/sources"); const j=await r.json(); setItems(j.items||[]); setTs(j.ts||Date.now()); }catch{} };
  useEffect(()=>{ load(); const i=setInterval(load,300000); return ()=>clearInterval(i); },[]);
  const dot=(s:Item["status"])=>s==="active"?"bg-emerald-500":s==="partial"?"bg-amber-500":"bg-rose-500";
  return (<div className="relative">
    <button onClick={()=>setOpen(v=>!v)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20">Sources <span className="inline-flex items-center gap-1"><i className={`w-2 h-2 rounded-full ${dot(overall(items))}`}/>{items.filter(i=>i.status==="active").length}/{items.length}</span></button>
    {open&&(<div className="absolute right-0 mt-2 w-[28rem] max-w-[90vw] glass rounded-2xl p-4 z-50">
      <div className="text-sm text-gray-300 mb-2">Last checked: {new Date(ts).toLocaleTimeString()}</div>
      <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">{items.map(it=>(
        <div key={it.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${dot(it.status)}`}/><span className="font-medium">{it.name}</span><span className={`text-xs ${it.tier==="premium"?"text-purple-300":"text-cyan-300"}`}>{it.tier}</span></div>
          <div className="text-xs text-gray-400">{it.status}{it.note?` • ${it.note}`:""}</div>
        </div>))}</div></div>)}
  </div>);
}
function overall(items:Item[]){ const hasErr=items.some(i=>i.status==="error"); const hasPart=items.some(i=>i.status==="partial"); return hasErr?"error":hasPart?"partial":"active" }

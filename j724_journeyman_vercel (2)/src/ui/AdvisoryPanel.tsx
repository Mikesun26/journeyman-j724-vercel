import React,{useEffect,useState} from "react";
export default function AdvisoryPanel(){
  const [notes,setNotes]=useState<string>(""); const [fx,setFx]=useState<any>(null); const [time,setTime]=useState<any>(null);
  useEffect(()=>{ (async()=>{ try{ const fxr=await fetch("/api/fx?base=AED&symbols=ZAR,USD,GBP,EUR&amount=1").then(r=>r.json()); setFx(fxr);
    const tz=await fetch("/api/worldtime?tz=Asia/Dubai").then(r=>r.json()); setTime(tz); }catch{} })(); },[]);
  return (<div>
    <h2 className="text-3xl font-bold text-cyan-400">Global Travel Advisory</h2>
    <div className="grid md:grid-cols-3 gap-4 mt-4">
      <div className="card"><div className="font-semibold mb-2">FX Snapshot</div><pre className="text-xs overflow-auto">{JSON.stringify(fx?.converted||fx?.rates,null,2)}</pre></div>
      <div className="card"><div className="font-semibold mb-2">Local Time</div><div className="text-sm">{time?.timezone}: {time?.datetime?new Date(time.datetime).toLocaleString(): "…"}</div><div className="text-xs text-gray-400">Offset {time?.offset}</div></div>
      <div className="card"><div className="font-semibold mb-2">Your Notes</div><textarea className="input h-40" placeholder="Paste intel or URL summaries…" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
    </div>
  </div>);
}

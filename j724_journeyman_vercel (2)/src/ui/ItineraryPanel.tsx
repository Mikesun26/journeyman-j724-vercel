import React,{useMemo,useState} from "react"; import { useAppStore,type Leg } from "../store"; import Papa from "papaparse";
import { useAppStore as store } from "../store";
const emptyLeg=():Leg=>({ departPlace:"", arrivePlace:"", departISO:new Date().toISOString(), arriveISO:new Date(Date.now()+2*3600e3).toISOString(), mode:"air", carrier:"" });
export default function ItineraryPanel(){
  const { legs,addLeg,updateLeg,removeLeg,report,setReport }=useAppStore(); const { settings } = store.getState(); const [busy,setBusy]=useState(false);
  const submit=async()=>{ setBusy(true); setReport(undefined); try{ const r=await fetch("/api/itinerary",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({legs})}); const j=await r.json(); if(!r.ok) throw new Error(j?.error||"Itinerary analysis failed"); setReport(j); }catch(e:any){ alert(e?.message||"Failed"); } finally{ setBusy(false); } };
  const add=()=>addLeg(emptyLeg()); const toMap=()=>window.dispatchEvent(new CustomEvent("jm:pois")); const printReport=()=>window.print();
  const downloadJSON=()=>{ const blob=new Blob([JSON.stringify({legs,report},null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="itinerary.json"; a.click(); URL.revokeObjectURL(url); };
  const importCSV=(file:File)=>{ Papa.parse(file,{header:true,complete:(res:any)=>{ const rows=res.data as any[]; rows.forEach(row=>addLeg({ departPlace:row.depart||row.departPlace||"", arrivePlace:row.arrive||row.arrivePlace||"", departISO:new Date(row.departISO||row.departDate||Date.now()).toISOString(), arriveISO:new Date(row.arriveISO||row.arriveDate||Date.now()+2*3600e3).toISOString(), mode:(row.mode||"air").toLowerCase(), carrier:row.carrier||"" } as Leg)); }}); };
  const legHelp=useMemo(()=> "CSV: depart, arrive, departISO, arriveISO, mode (air/sea/road/rail), carrier",[]);

  const missionPack = async()=>{
    if(!report){ alert("Run Analyze Itinerary first."); return; }
    // Ask EDD panel (if open) for a snapshot
    let edd:any = null;
    const waiter = new Promise<void>((resolve)=>{
      const onEdd = (e:any)=>{ edd = e.detail; window.removeEventListener("jm:edd", onEdd as EventListener); resolve(); };
      window.addEventListener("jm:edd", onEdd as EventListener, { once: true });
      window.dispatchEvent(new CustomEvent("jm:get-edd"));
      setTimeout(()=>{ window.removeEventListener("jm:edd", onEdd as EventListener); resolve(); }, 800);
    });
    await waiter;
    const payload = { report, edd, meta: { generatedAt: new Date().toISOString() } };
    const r = await fetch("/api/mission-pack", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) { const t=await r.text(); alert("Mission Pack failed: "+t); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="Mission_Pack.pdf"; a.click(); URL.revokeObjectURL(url);
  };

  return (<div>
    <div className="flex items-center justify-between"><h2 className="text-3xl font-bold text-cyan-400">Itinerary Intelligence</h2>
      <div className="flex gap-2 no-print">
        <button className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={add}>Add Leg</button>
        <label className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 cursor-pointer">Import CSV<input type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) importCSV(f);}}/></label>
        <button className={`px-4 py-2 rounded-2xl ${busy?"bg-gray-600":"btn-cta"}`} onClick={submit} disabled={busy}>{busy?"Analyzing…":"Analyze Itinerary"}</button>
        {report&&<button className="px-4 py-2 rounded-2xl bg-purple-600" onClick={toMap}>Add POIs to Map</button>}
        {report&&<button className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={downloadJSON}>Download JSON</button>}
        {report&&<button className="px-4 py-2 rounded-2xl bg-green-600" onClick={missionPack}>Mission Pack (PDF)</button>}
        {report&&<button className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={printReport}>Print / PDF</button>}
      </div>
    </div>
    <div className="text-xs text-gray-400 mt-1 no-print">{legHelp}</div>
    <div className={`mt-6 ${settings.compactList? "grid grid-cols-1 gap-3":"grid grid-cols-1 gap-6"}`}>{settings.compactList? legs.map((l,i)=>(
<details key={i} className="card details-card">
  <summary className="flex justify-between items-center">
    <span className="twist font-semibold">Leg {i+1}: {l.departPlace||"?"} → {l.arrivePlace||"?"}</span>
    <button type="button" className="px-3 py-1 rounded-xl bg-pink-600 no-print" onClick={(e)=>{e.preventDefault(); removeLeg(i);}}>Remove</button>
  </summary>
  <div className="grid md:grid-cols-2 gap-3 mt-3">
    <input className="input" placeholder="Depart place" value={l.departPlace} onChange={e=>updateLeg(i,{departPlace:e.target.value})}/>
    <input className="input" placeholder="Arrive place" value={l.arrivePlace} onChange={e=>updateLeg(i,{arrivePlace:e.target.value})}/>
    <input type="datetime-local" className="input" value={toInput(l.departISO)} onChange={e=>updateLeg(i,{departISO:fromInput(e.target.value)})}/>
    <input type="datetime-local" className="input" value={toInput(l.arriveISO)} onChange={e=>updateLeg(i,{arriveISO:fromInput(e.target.value)})}/>
    <select className="input" value={l.mode} onChange={e=>updateLeg(i,{mode:e.target.value as any})}><option value="air">Air</option><option value="sea">Sea</option><option value="road">Road</option><option value="rail">Rail</option></select>
    <input className="input" placeholder="Carrier (optional)" value={l.carrier||""} onChange={e=>updateLeg(i,{carrier:e.target.value})}/>
  </div>
</details>
)) : legs.map((l,i)=>(<div key={i} className="card">
      <div className="flex justify-between items-center mb-3"><div className="font-semibold">Leg {i+1}</div><button className="px-3 py-1 rounded-xl bg-pink-600 no-print" onClick={()=>removeLeg(i)}>Remove</button></div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="input" placeholder="Depart place" value={l.departPlace} onChange={e=>updateLeg(i,{departPlace:e.target.value})}/>
        <input className="input" placeholder="Arrive place" value={l.arrivePlace} onChange={e=>updateLeg(i,{arrivePlace:e.target.value})}/>
        <input type="datetime-local" className="input" value={toInput(l.departISO)} onChange={e=>updateLeg(i,{departISO:fromInput(e.target.value)})}/>
        <input type="datetime-local" className="input" value={toInput(l.arriveISO)} onChange={e=>updateLeg(i,{arriveISO:fromInput(e.target.value)})}/>
        <select className="input" value={l.mode} onChange={e=>updateLeg(i,{mode:e.target.value as any})}><option value="air">Air</option><option value="sea">Sea</option><option value="road">Road</option><option value="rail">Rail</option></select>
        <input className="input" placeholder="Carrier (optional)" value={l.carrier||""} onChange={e=>updateLeg(i,{carrier:e.target.value})}/>
      </div>
    </div>))}</div>
    {report&&(<div className="mt-8"><h3 className="text-2xl font-bold text-cyan-300">Report</h3>
      <div className="text-lg mt-1">Overall Risk: <span className={`${report.overallRisk>70?"text-red-400":report.overallRisk>40?"text-orange-400":"text-green-400"}`}>{report.overallRisk}/100</span></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">{report.legs.map((leg:any)=>(<div key={leg.index} className="card">
        <div className="font-semibold mb-1">Leg {leg.index+1}: {leg.depart.name} → {leg.arrive.name}</div>
        <div className="text-sm text-gray-300 mb-2">{new Date(leg.depart.time).toLocaleString()} → {new Date(leg.arrive.time).toLocaleString()} • {leg.distance_km.toFixed(0)} km</div>
        <div className="mb-2"><strong>Risk:</strong> <span className={`${leg.risk>70?"text-red-400":leg.risk>40?"text-orange-400":"text-green-400"}`}>{leg.risk}/100</span></div>
        <div className="mb-2"><strong>Arrival Weather:</strong> {leg.weather.summary} • {leg.weather.tempC.toFixed(0)}°C • wind {leg.weather.windKph.toFixed(0)} km/h • precip {Math.round(leg.weather.precipProb)}%</div>
        <div className="mb-2"><strong>Nearby Hazards:</strong><ul className="list-disc ml-5 text-sm">{leg.nearbyHazards.slice(0,5).map((h:any,ix:number)=>(<li key={ix}>{h.label} ({h.source}) • {h.distance_km.toFixed(0)} km</li>))}</ul></div>
      </div>))}</div>
      <div className="text-xs text-gray-400 mt-3">Sources: Open-Meteo, Overpass/OSM, USGS, GDACS, EONET, ReliefWeb.</div>
    </div>)}
  </div>);
}
function toInput(iso:string){ const d=new Date(iso); const z=new Date(d.getTime()-d.getTimezoneOffset()*60000); return z.toISOString().slice(0,16) }
function fromInput(local:string){ const d=new Date(local); return new Date(d.getTime()+d.getTimezoneOffset()*60000).toISOString() }

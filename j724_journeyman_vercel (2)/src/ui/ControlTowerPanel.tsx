import React, { useState } from "react";
export default function ControlTowerPanel(){
  const [sku,setSku]=useState("SKU-001");
  const [history,setHistory]=useState<string>("2025-10-01,120\n2025-10-02,118\n2025-10-03,130");
  const [predict,setPredict]=useState<any>(null);
  const [scenario,setScenario]=useState("port_closure");
  const [severity,setSeverity]=useState(0.6);
  const [sim,setSim]=useState<any>(null);
  const [inv,setInv]=useState<any>(null);
  const [actions,setActions]=useState<any>(null);
  const [whatif,setWhatif]=useState<any>(null);

  const parseHistory = ()=> history.split("\n").map(l=>l.trim()).filter(Boolean).map(line=>{
    const [ts,val] = line.split(","); return { ts, value: Number(val||0) };
  });

  const call = async (path:string, body:any)=> {
    const r = await fetch(`/api/chaoschain${path}`, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error((await r.text())||"error");
    return r.json();
  };

  const runPredict = async()=> setPredict(await call("/predict", { sku, horizon_days: 30, history: parseHistory(), exogenous: {} }));
  const runSim = async()=> setSim(await call("/simulate", { scenario, params:{ severity }, routes: [] }));
  const runInv = async()=> setInv(await call("/inventory/status", { sku, on_hand: 250, lead_time_days: 12, service_level: 0.95, demand_forecast: (predict?.forecast||[]).slice(0,14) }));
  const runActions = async()=> setActions(await call("/actions/next", { context: { delay_days: sim?.impact?.lead_time_delta_days||0, fill_rate: 0.92 } }));
  const runWhatIf = async()=> setWhatif(await call("/enhance/whatif", { question: "What if we reroute 40% via Jebel Ali?", knobs: { reroute_share: 0.4, expedite_pct: 0.1 } }));
  const dl = (obj:any,name:string)=>{ const b=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=name; a.click(); URL.revokeObjectURL(u); };

  return (
    <div>
      <h2 className="text-3xl font-bold text-cyan-400">Control Tower</h2>
      <div className="grid lg:grid-cols-2 gap-6 mt-4">
        <div className="card">
          <div className="font-semibold mb-2">Demand Forecast</div>
          <input className="input mb-2" value={sku} onChange={e=>setSku(e.target.value)} placeholder="SKU"/>
          <textarea className="input h-28 mb-2" value={history} onChange={e=>setHistory(e.target.value)} placeholder="YYYY-MM-DD,value per line"/>
          <button className="px-4 py-2 rounded-2xl bg-cyan-600" onClick={runPredict}>Predict</button>
          {predict && <pre className="text-xs mt-2 max-h-60 overflow-auto">{JSON.stringify(predict,null,2)}</pre>}
          {predict && <button className="mt-2 px-3 py-1 rounded-xl bg-white/10" onClick={()=>dl(predict,"forecast.json")}>Download JSON</button>}
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Disruption Simulation</div>
          <select className="input mb-2" value={scenario} onChange={e=>setScenario(e.target.value)}>
            <option value="port_closure">Port closure</option>
            <option value="lane_delay">Lane delay</option>
            <option value="demand_spike">Demand spike</option>
          </select>
          <label className="text-sm opacity-80 mb-1 block">Severity: {severity}</label>
          <input type="range" min="0" max="1" step="0.05" value={severity} onChange={e=>setSeverity(Number(e.target.value))} className="w-full mb-2"/>
          <button className="px-4 py-2 rounded-2xl bg-cyan-600" onClick={runSim}>Simulate</button>
          {sim && <pre className="text-xs mt-2 max-h-60 overflow-auto">{JSON.stringify(sim,null,2)}</pre>}
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Inventory Policy</div>
          <button className="px-4 py-2 rounded-2xl bg-cyan-600" onClick={runInv} disabled={!predict}>Compute</button>
          {!predict && <div className="text-xs text-gray-400 mt-2">Run forecast first.</div>}
          {inv && <pre className="text-xs mt-2 max-h-60 overflow-auto">{JSON.stringify(inv,null,2)}</pre>}
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Next Best Actions</div>
          <button className="px-4 py-2 rounded-2xl bg-cyan-600" onClick={runActions} disabled={!sim}>Recommend</button>
          {!sim && <div className="text-xs text-gray-400 mt-2">Run simulation first.</div>}
          {actions && <pre className="text-xs mt-2 max-h-60 overflow-auto">{JSON.stringify(actions,null,2)}</pre>}
        </div>
        <div className="card lg:col-span-2">
          <div className="font-semibold mb-2">What-If Enhancements</div>
          <button className="px-4 py-2 rounded-2xl bg-cyan-600" onClick={runWhatif}>Run What-If</button>
          {whatif && <pre className="text-xs mt-2 max-h-60 overflow-auto">{JSON.stringify(whatif,null,2)}</pre>}
        </div>
      </div>
    </div>
  );
}

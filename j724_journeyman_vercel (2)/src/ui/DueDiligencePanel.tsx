import React,{ useEffect, useMemo, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core } from "cytoscape";
import { useAppStore } from "../store";
import ResearchTools from "./ResearchTools";

type Hit = { id:string; name:string; schema:string; score:number; sources:string[]; countries?:string[]; birth?:string; };
type Media = { title:string; url:string; lang:string; date:string; source:string; };
type GraphEdge = { source:string; target:string; label:string };

export default function DueDiligencePanel(){
  const { addCase, cases } = useAppStore();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [focus, setFocus] = useState<string>("");
  const [openTools, setOpenTools] = useState(true);
  const cyRef = useRef<Core|null>(null);

  useEffect(()=>{
    const handler = () => {
      try{
        const graphPng = cyRef.current ? cyRef.current.png({ full:true, scale:2 }) : null;
        const payload = { hits, media, query: q, graphPng };
        window.dispatchEvent(new CustomEvent("jm:edd", { detail: payload }));
      }catch{}
    };
    window.addEventListener("jm:get-edd", handler as EventListener);
    return ()=> window.removeEventListener("jm:get-edd", handler as EventListener);
  }, [hits, media, q]);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true); setHits([]); setMedia([]); setEdges([]); setFocus("");
    try {
      const r = await fetch("/api/edd?query="+encodeURIComponent(q.trim()));
      const j = await r.json();
      setHits(j?.sanctions?.hits||[]);
      setMedia(j?.adverse?.items||[]);
      setEdges(j?.graph?.edges||[]);
      setFocus(j?.graph?.focus||"");
    } catch (e:any) { alert(e?.message || "EDD failed"); } finally { setBusy(false); }
  };

  const saveCase = () => {
    const id = crypto.randomUUID();
    addCase({ id, subject: q.trim(), created: Date.now(), data: { hits, media, edges }});
    alert("Saved to Cases.");
  };

  const elements = useMemo(()=>{
    const nodes = new Map<string,{ data:any }>();
    if (focus) nodes.set(focus, { data:{ id: focus, label: q.trim() || focus, type:"subject" } });
    edges.forEach(e=>{
      if(!nodes.has(e.source)) nodes.set(e.source, { data:{ id:e.source, label:e.source, type:"entity" } });
      if(!nodes.has(e.target)) nodes.set(e.target, { data:{ id:e.target, label:e.target, type:"entity" } });
    });
    return [...Array.from(nodes.values()), ...edges.map(e=>({ data:{ id:`${e.source}->${e.target}`, source:e.source, target:e.target, label:e.label }}))];
  }, [edges, focus, q]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-cyan-400">Enhanced Due Diligence</h2>
        <div className="flex gap-2 no-print">
          <button className={`px-4 py-2 rounded-2xl ${busy?"bg-gray-600":"btn-cta"}`} onClick={search} disabled={busy}>{busy?"Searching…":"Run Screening"}</button>
          <button className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={()=>setOpenTools(s=>!s)}>{openTools?"Hide":"Show"} Research Tools</button>
          {(hits.length || media.length) ? <button className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={saveCase}>Save Case</button> : null}
          {(hits.length || media.length) ? <button className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={()=>window.print()}>Export / Print</button> : null}
        </div>
      </div>

      {openTools && <ResearchTools />}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <div className="font-semibold mb-2">PEP & Sanctions Matches</div>
          {!hits.length && <div className="text-sm text-gray-300">No matches yet.</div>}
          {!!hits.length && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-300"><th className="py-1">Name</th><th>Schema</th><th>Score</th><th>Sources</th></tr></thead>
              <tbody>{hits.map((h,i)=>(<tr key={i} className="border-t border-white/10"><td className="py-1">{h.name}</td><td>{h.schema}</td><td>{Math.round(h.score*100)}</td><td className="text-xs">{h.sources?.slice(0,3).join(", ")}</td></tr>))}</tbody>
            </table>
          )}
          <div className="text-xs text-gray-400 mt-2">Source: OpenSanctions API.</div>
        </div>

        <div className="card">
          <div className="font-semibold mb-2">Adverse Media (last 90 days)</div>
          {!media.length && <div className="text-sm text-gray-300">No hits yet.</div>}
          {!!media.length && (
            <ul className="text-sm space-y-2 max-h-64 overflow-y-auto">
              {media.map((m,i)=>(<li key={i} className="bg-white/5 rounded-xl p-2">
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-gray-400">{m.source} • {m.lang} • {new Date(m.date).toLocaleDateString()}</div>
                <a className="text-cyan-300 text-xs" href={m.url} target="_blank" rel="noreferrer">Open</a>
              </li>))}
            </ul>
          )}
          <div className="text-xs text-gray-400 mt-2">Source: GDELT DOC 2.0 API.</div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="font-semibold mb-2">Ownership / Relationship Graph</div>
        <div className="h-80 bg-white/5 rounded-xl">
          <CytoscapeComponent
            elements={elements as any}
            style={{ width:"100%", height:"100%" }}
            layout={{ name:"cose", animate:true }}
            cy={(cy)=>{ cyRef.current=cy as any; }}
            stylesheet={[
              { selector:"node", style:{ "background-color":"#60a5fa", "label":"data(label)", "color":"#fff", "font-size":"10px" } },
              { selector:'node[type="subject"]', style:{ "background-color":"#10b981", "width":20, "height":20 } },
              { selector:"edge", style:{ "width":1, "line-color":"#a78bfa", "target-arrow-color":"#a78bfa", "target-arrow-shape":"triangle", "curve-style":"bezier", "label":"data(label)", "font-size":"8px", "color":"#ddd" } }
            ]}
          />
        </div>
        <div className="text-xs text-gray-400 mt-2">Edges: associates/referrals (OpenSanctions entity graph).</div>
      </div>
    </div>
  );
}

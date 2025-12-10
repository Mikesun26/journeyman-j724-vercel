import React, { useState } from "react";
export default function ResearchTools(){
  return (
    <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4 mt-4">
      <DorksCard /><BGPCard /><CVECard /><OptionalIntelCard />
    </div>
  );
}
function DorksCard(){
  const [domain,setDomain]=useState(""); const [person,setPerson]=useState("");
  const mk = (q:string)=>`https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const core = domain? domain : "example.com";
  const dorks = [
    ["Public docs", `site:${core} (filetype:pdf OR filetype:xls OR filetype:docx)`],
    ["Indexable dirs", `site:${core} intitle:index.of`],
    ["Exposed creds (generic)", `"password" site:${core} -github`],
    ["Emails", `site:${core} "@${core.split(".").slice(-2).join(".")}"`],
    ["Person mentions", person?`"${person}" site:${core}`:`site:${core} "executive"`],
  ];
  return (
    <div className="card"><div className="font-semibold mb-2">Google Dorks (safe links)</div>
      <input className="input mb-2" placeholder="domain (example.com)" value={domain} onChange={e=>setDomain(e.target.value)} />
      <input className="input mb-2" placeholder="person (optional)" value={person} onChange={e=>setPerson(e.target.value)} />
      <ul className="text-sm space-y-2">{dorks.map(([label,q],i)=>(<li key={i}><a className="text-cyan-300" href={mk(q)} target="_blank" rel="noreferrer">{label}</a><span className="text-xs text-gray-400"> — {q}</span></li>))}</ul>
      <div className="text-[11px] text-gray-400 mt-2">OpSec: Only search what you’re authorized to assess.</div>
    </div>
  );
}
function BGPCard(){
  const [ip,setIp]=useState(""); const [asn,setAsn]=useState(""); const [res,setRes]=useState<any>(null);
  const run = async()=>{ const u = ip? `/api/bgpview?ip=${encodeURIComponent(ip)}` : asn? `/api/bgpview?asn=${encodeURIComponent(asn)}` : ""; if(!u) return alert("Enter IP or ASN"); const j=await fetch(u).then(r=>r.json()); setRes(j); };
  return (
    <div className="card"><div className="font-semibold mb-2">BGPView (IP/ASN)</div>
      <input className="input mb-2" placeholder="IP (e.g., 8.8.8.8)" value={ip} onChange={e=>setIp(e.target.value)} />
      <input className="input mb-2" placeholder="ASN (e.g., AS15169)" value={asn} onChange={e=>setAsn(e.target.value)} />
      <div className="flex gap-2"><button className="px-4 py-2 rounded-2xl bg-cyan-600" onClick={run}>Lookup</button><button className="px-4 py-2 rounded-2xl bg-white/10" onClick={()=>setRes(null)}>Clear</button></div>
      {res && <pre className="text-xs mt-2 max-h-64 overflow-auto">{JSON.stringify(res,null,2)}</pre>}
    </div>
  );
}
function CVECard(){
  const [id,setId]=useState(""); const [q,setQ]=useState(""); const [res,setRes]=useState<any>(null);
  const run = async()=>{ const u = id? `/api/cve?id=${encodeURIComponent(id)}` : `/api/cve?q=${encodeURIComponent(q||"")}&&limit=20`; const j=await fetch(u).then(r=>r.json()); setRes(j); };
  return (
    <div className="card"><div className="font-semibold mb-2">CVE Finder</div>
      <input className="input mb-2" placeholder="CVE-YYYY-NNNN" value={id} onChange={e=>setId(e.target.value)} />
      <input className="input mb-2" placeholder="keyword (e.g., OpenSSL)" value={q} onChange={e=>setQ(e.target.value)} />
      <button className="px-4 py-2 rounded-2xl bg-cyan-600" onClick={run}>Search</button>
      {res && <pre className="text-xs mt-2 max-h-64 overflow-auto">{JSON.stringify(res,null,2)}</pre>}
    </div>
  );
}
function OptionalIntelCard(){
  const [domain,setDomain]=useState(""); const [email,setEmail]=useState(""); const [ip,setIp]=useState(""); const [out,setOut]=useState<any>(null);
  const go = async(kind:string, qs:Record<string,string>)=>{
    const u = `/api/osint-proxy?kind=${encodeURIComponent(kind)}&` + new URLSearchParams(qs).toString();
    const j = await fetch(u).then(r=>r.json()); setOut({ kind, j });
  };
  return (
    <div className="card"><div className="font-semibold mb-2">Optional Intel (keys enable)</div>
      <input className="input mb-2" placeholder="domain (SecurityTrails)" value={domain} onChange={e=>setDomain(e.target.value)} />
      <input className="input mb-2" placeholder="email (HIBP)" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input mb-2" placeholder="ip (Shodan/Censys)" value={ip} onChange={e=>setIp(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <button className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={()=>go("securitytrails",{domain})}>SecurityTrails</button>
        <button className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={()=>go("hibp",{email})}>HIBP</button>
        <button className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={()=>go("shodan",{ip})}>Shodan</button>
        <button className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20" onClick={()=>go("censys",{ip})}>Censys</button>
      </div>
      {out && <pre className="text-xs mt-2 max-h-64 overflow-auto">{JSON.stringify(out,null,2)}</pre>}
      <div className="text-[11px] text-gray-400 mt-2">Disabled until keys are set; UI stays consistent.</div>
    </div>
  );
}

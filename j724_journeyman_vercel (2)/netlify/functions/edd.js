const UA = { "User-Agent":"journeyman-edd/1.0" };
const J=(b,s=200)=>({ statusCode:s, headers:{ "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify(b) });
exports.handler = async (event)=>{
  const q = (event.queryStringParameters?.query || "").trim();
  if (!q) return J({ error:"query required" }, 400);
  try{
    const os = await fetch(`https://api.opensanctions.org/search/default?q=${encodeURIComponent(q)}&limit=10`,{headers:UA}).then(r=>r.json()).catch(()=>null);
    const rawHits = os?.results || [];
    const hits = rawHits.map(h=>({ id:h.id, name:h.caption, schema:h.schema, score:h.score||0, sources:h.datasets||[], countries:h.properties?.countries||h.properties?.jurisdiction||[], birth:h.properties?.birthDate||h.properties?.incorporationDate }));
    let edges=[]; let focus=hits[0]?.id||"";
    if(focus){
      try{ const ent = await fetch(`https://api.opensanctions.org/entities/${encodeURIComponent(focus)}`,{headers:UA}).then(r=>r.json());
        const relEdges=[]; const claims = ent?.properties?.associates || []; if(Array.isArray(claims)){ claims.slice(0,50).forEach(c=>{ if(c?.id) relEdges.push({ source: ent.id, target: c.id, label: "associate" }); }); }
        (ent?.referents||[]).slice(0,50).forEach(r=>{ if(r?.id) relEdges.push({ source: ent.id, target: r.id, label: "linked" }); });
        const seen=new Set(); edges=relEdges.filter(e=>{ const k=`${e.source}->${e.target}:${e.label}`; if(seen.has(k)) return false; seen.add(k); return true; }).slice(0,120);
      }catch{}
    }
    const gd = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&maxrecords=25&format=json&sort=DateDesc`,{headers:UA}).then(r=>r.json()).catch(()=>null);
    const media = (gd?.articles||[]).map(a=>({ title:a.title||a.seendate||"article", url:a.url, lang:a.language||"unk", date:a.seendate||"", source:a.sourceCommonName||a.domain||"" }));
    return J({ sanctions:{ hits }, adverse:{ items: media }, graph:{ focus, edges } });
  }catch(e){ return J({ error: e?.message || "edd failed" }, 502); }
};

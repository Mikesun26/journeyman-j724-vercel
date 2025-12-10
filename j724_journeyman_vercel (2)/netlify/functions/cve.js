const J=(b,s=200)=>({ statusCode:s, headers:{ "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify(b) });
exports.handler = async (e)=>{
  const id = e.queryStringParameters?.id?.trim();
  const q  = e.queryStringParameters?.q?.trim();
  const max = Number(e.queryStringParameters?.limit||"10");
  try {
    if (id) {
      const r = await fetch(`https://cve.circl.lu/api/cve/${encodeURIComponent(id)}`);
      if (!r.ok) return J({ error:`CVE not found (${r.status})` }, r.status);
      return J(await r.json());
    }
    if (q) {
      const r = await fetch(`https://cve.circl.lu/api/query?search=${encodeURIComponent(q)}`);
      const j = await r.json();
      return J({ results: Array.isArray(j) ? j.slice(0, Math.min(50,max)) : [] });
    }
    const r = await fetch(`https://cve.circl.lu/api/last`);
    const j = await r.json();
    return J({ results: Array.isArray(j) ? j.slice(0, Math.min(50,max)) : [] });
  } catch (err){ return J({ error: err?.message || "cve failed" }, 502); }
};

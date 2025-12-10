const json = (b,s=200)=>({statusCode:s,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(b)});
exports.handler = async (event) => {
  const base = process.env.CHAOSCHAIN_BASE || "";
  if (!base) return json({ error:"CHAOSCHAIN_BASE not set" }, 500);
  const token = process.env.CHAOSCHAIN_TOKEN || "";
  const path = event.path.replace(/^\/\.netlify\/functions\/chaoschain/,"");
  const url = `${base}${path}${event.rawQuery ? `?${event.rawQuery}` : ""}`;
  const headers = { "content-type":"application/json" };
  if (token) headers["x-token"] = token;
  try{
    const r = await fetch(url, { method:event.httpMethod, headers, body: ["POST","PUT","PATCH"].includes(event.httpMethod) ? event.body : undefined });
    const text = await r.text();
    return { statusCode: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" }, body: text };
  }catch(e){ return json({ error:e?.message||"proxy failed" }, 502); }
};

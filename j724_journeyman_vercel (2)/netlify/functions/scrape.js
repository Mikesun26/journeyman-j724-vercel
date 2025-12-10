exports.handler = async (event)=>{
  if (!["GET","POST"].includes(event.httpMethod)) return json({ error:"GET/POST only" }, 405);
  try {
    const body = event.httpMethod === "POST" && event.body ? JSON.parse(event.body) : {};
    const url = (event.queryStringParameters?.url || body.url || "").trim();
    if (!url || !/^https?:\/\//i.test(url)) return json({ error:"Valid url required" }, 400);
    const provider = (process.env.SCRAPER_PROVIDER||"").toLowerCase();
    const key = process.env.SCRAPER_API_KEY || "";
    const base = process.env.SCRAPER_BASE || "";
    const fetcher = choose(provider, key, base);
    const { finalURL, res } = await fetcher(url);
    const status = res.status;
    const headers = {}; res.headers.forEach((v,k)=> headers[k]=v);
    const html = await res.text();
    const meta = extractMeta(html);
    return json({ url: finalURL || url, status, headers, html, meta });
  } catch (e){ return json({ error: e?.message || "scrape error" }, 502); }
};
function json(b,s=200){ return { statusCode:s, headers:{ "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify(b) }; }
function choose(provider, key, base){
  const UA = { "User-Agent":"journeyman-scraper/1.0 (+security)" };
  if (base && key) return async url => { const u = new URL(base); u.searchParams.set("url", url); u.searchParams.set("key", key); const res = await fetch(u.toString(), { headers: UA }); return { finalURL:url, res }; };
  if (provider==="zenrows" && key) return async url => { const u=new URL("https://api.zenrows.com/v1/"); u.searchParams.set("url",url); u.searchParams.set("apikey",key); u.searchParams.set("js_render","true"); u.searchParams.set("premium_proxy","true"); const res=await fetch(u.toString(),{headers:UA}); return { finalURL:url,res }; };
  if (provider==="scraperapi" && key) return async url => { const u=new URL("http://api.scraperapi.com"); u.searchParams.set("api_key",key); u.searchParams.set("url",url); u.searchParams.set("render","true"); const res=await fetch(u.toString(),{headers:UA}); return { finalURL:url,res }; };
  if (provider==="scrapingbee" && key) return async url => { const u=new URL("https://app.scrapingbee.com/api/v1/"); u.searchParams.set("api_key",key); u.searchParams.set("url",url); u.searchParams.set("render_js","true"); const res=await fetch(u.toString(),{headers:UA}); return { finalURL:url,res }; };
  return async url => { const res = await fetch(url, { headers:{ ...UA, "accept":"text/html,application/xhtml+xml" } }); return { finalURL: res.url, res }; };
}
function extractMeta(html){ const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"").trim().slice(0,200); const len=html.length; const desc=(html.match(/<meta[^>]+name=[\"']description[\"'][^>]+content=[\"']([^\"']+)[\"']/i)?.[1]||"").trim().slice(0,240); return { title, description: desc, length: len }; }

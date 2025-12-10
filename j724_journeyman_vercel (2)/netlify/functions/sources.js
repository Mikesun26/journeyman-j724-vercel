const getJSON = (u)=>fetch(u).then(r=>r.json());
const probe = async (id,name,tier,fn, note="")=>{ try{ await fn(); return {id,name,tier,status:"active",note}; }catch(e){ return {id,name,tier,status:"partial",note:e?.message?.slice(0,60)||note}; } };
exports.handler = async ()=>{
  const items = [];
  items.push(await probe("opensanctions","OpenSanctions","free", ()=>getJSON("https://api.opensanctions.org/datasets")));
  items.push(await probe("gdelt","GDELT DOC 2.0","free", ()=>getJSON("https://api.gdeltproject.org/api/v2/doc/doc?query=example&maxrecords=1&format=json")));
  items.push(await probe("bgpview","BGPView","free", ()=>getJSON("https://api.bgpview.io/asn/15169")));
  items.push(await probe("cve","CVE (CIRCL)","free", ()=>getJSON("https://cve.circl.lu/api/last")));
  // Scraper presence (we don't call provider directly here; just indicate configured)
  if (process.env.SCRAPER_PROVIDER || process.env.SCRAPER_API_KEY || process.env.SCRAPER_BASE) { items.push({id:"scraper",name:"Scraper Adapter",tier:"premium",status:"active",note:"configured"}); }
  // Optional keyed services
  if (process.env.HIBP_KEY) items.push({id:"hibp",name:"Have I Been Pwned",tier:"premium",status:"active"});
  if (process.env.SECURITYTRAILS_KEY) items.push({id:"securitytrails",name:"SecurityTrails",tier:"premium",status:"active"});
  if (process.env.SHODAN_KEY) items.push({id:"shodan",name:"Shodan",tier:"premium",status:"active"});
  if (process.env.CENSYS_UID && process.env.CENSYS_SECRET) items.push({id:"censys",name:"Censys",tier:"premium",status:"active"});
  return { statusCode: 200, headers: { "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify({ ts: Date.now(), items }) };
};

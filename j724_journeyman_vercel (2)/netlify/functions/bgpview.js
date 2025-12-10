const J=(b,s=200)=>({ statusCode:s, headers:{ "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify(b) });
exports.handler = async (e)=>{
  const ip = e.queryStringParameters?.ip?.trim();
  const asn = e.queryStringParameters?.asn?.trim()?.toUpperCase();
  const prefix = e.queryStringParameters?.prefix?.trim();
  try {
    if (ip) {
      const [ipinfo, peers] = await Promise.all([
        fetch(`https://api.bgpview.io/ip/${encodeURIComponent(ip)}`).then(r=>r.json()),
        fetch(`https://api.bgpview.io/ip/${encodeURIComponent(ip)}/upstreams`).then(r=>r.json()).catch(()=>({data:{}}))
      ]);
      return J({ kind:"ip", ipinfo, peers });
    }
    if (asn) {
      const n = asn.replace(/^AS/i,"");
      const [asninfo, prefixes, peers] = await Promise.all([
        fetch(`https://api.bgpview.io/asn/${encodeURIComponent(n)}`).then(r=>r.json()),
        fetch(`https://api.bgpview.io/asn/${encodeURIComponent(n)}/prefixes`).then(r=>r.json()),
        fetch(`https://api.bgpview.io/asn/${encodeURIComponent(n)}/peers`).then(r=>r.json())
      ]);
      return J({ kind:"asn", asninfo, prefixes, peers });
    }
    if (prefix) {
      const res = await fetch(`https://api.bgpview.io/prefix/${encodeURIComponent(prefix)}`).then(r=>r.json());
      return J({ kind:"prefix", res });
    }
    return J({ error:"Provide ?ip= or ?asn= or ?prefix=" }, 400);
  } catch (err){ return J({ error: err?.message || "bgpview failed" }, 502); }
};

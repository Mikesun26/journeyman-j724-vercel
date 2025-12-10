const J=(b,s=200)=>({ statusCode:s, headers:{ "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify(b) });
exports.handler = async (e)=>{
  const kind = (e.queryStringParameters?.kind||"").toLowerCase();
  try {
    if (kind === "hibp") {
      const key = process.env.HIBP_KEY; if (!key) return J({ error:"HIBP_KEY missing" }, 400);
      const email = e.queryStringParameters?.email?.trim(); if (!email) return J({ error:"email required" }, 400);
      const r = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`,{ headers:{ "hibp-api-key": key, "user-agent":"journeyman-osint/1.0" } });
      return J({ status:r.status, data: r.status===200 ? await r.json() : [] });
    }
    if (kind === "securitytrails") {
      const key = process.env.SECURITYTRAILS_KEY; if (!key) return J({ error:"SECURITYTRAILS_KEY missing" }, 400);
      const domain = e.queryStringParameters?.domain?.trim(); if (!domain) return J({ error:"domain required" }, 400);
      const r = await fetch(`https://api.securitytrails.com/v1/domain/${encodeURIComponent(domain)}`,{ headers:{ "apikey": key }});
      return J({ status:r.status, data: await r.json() });
    }
    if (kind === "shodan") {
      const key = process.env.SHODAN_KEY; if (!key) return J({ error:"SHODAN_KEY missing" }, 400);
      const ip = e.queryStringParameters?.ip?.trim(); if (!ip) return J({ error:"ip required" }, 400);
      const r = await fetch(`https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${encodeURIComponent(key)}`);
      return J({ status:r.status, data: await r.json() });
    }
    if (kind === "censys") {
      const uid = process.env.CENSYS_UID, sec = process.env.CENSYS_SECRET; if (!uid||!sec) return J({ error:"CENSYS_UID/SECRET missing" }, 400);
      const ip = e.queryStringParameters?.ip?.trim() || "";
      const q = ip ? `ip: ${ip}` : (e.queryStringParameters?.q?.trim()||"services.service_name: HTTP");
      const r = await fetch("https://search.censys.io/api/v2/hosts/search",{
        method:"POST",
        headers:{ "content-type":"application/json", "Authorization":"Basic "+Buffer.from(`${uid}:${sec}`).toString("base64") },
        body:JSON.stringify({ q, per_page: 5 })
      });
      return J({ status:r.status, data: await r.json() });
    }
    return J({ error:"unsupported kind" }, 400);
  } catch (err){ return J({ error: err?.message || "osint-proxy failed" }, 502); }
};

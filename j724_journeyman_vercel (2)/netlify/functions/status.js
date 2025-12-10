const J=(b,s=200)=>({ statusCode:s, headers:{ "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify(b) });
const ping = async (u) => { try{ const r=await fetch(u,{ method:"GET", headers:{ "User-Agent":"journeyman-status/1.0" } }); return r.ok; }catch{ return false } };
exports.handler = async ()=>{
  const checks = {};
  checks.opensanctions = await ping("https://api.opensanctions.org/datasets");
  checks.gdelt = await ping("https://api.gdeltproject.org/api/v2/doc/doc?query=test&maxrecords=1&format=json");
  checks.openmeteo = await ping("https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&hourly=temperature_2m&forecast_days=1");
  checks.overpass = await (async()=>{
    try{
      const q = "[out:json][timeout:10];node(0,0,1,1);out 1;";
      const r = await fetch("https://overpass-api.de/api/interpreter",{ method:"POST", headers:{ "content-type":"application/x-www-form-urlencoded" }, body: new URLSearchParams({ data:q }) });
      return r.ok;
    }catch{ return false; }
  })();
  checks.usgs = await ping("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
  checks.eonet = await ping("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=1");
  checks.reliefweb = await ping("https://api.reliefweb.int/v1/disasters?limit=1");
  return J({ ok: true, runtime: { node: process.version }, checks });
};

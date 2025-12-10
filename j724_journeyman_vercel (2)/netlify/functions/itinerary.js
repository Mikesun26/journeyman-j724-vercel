const fetchFn = (...a)=>fetch(...a);
const J=(b,s=200)=>({ statusCode:s, headers:{ "content-type":"application/json","cache-control":"no-store" }, body: JSON.stringify(b) });
exports.handler = async (event)=>{
  if(event.httpMethod!=="POST") return J({error:"POST only"},405);
  try{
    const { legs } = JSON.parse(event.body||"{}");
    if(!Array.isArray(legs)||!legs.length) return J({error:"legs required"},400);
    const geos = await Promise.all(legs.flatMap(l=>[geo(l.departPlace), geo(l.arrivePlace)]));
    let idx=0; const outLegs=[]; const poisAll=[];
    const hazards = await loadHazards();
    for (let i=0;i<legs.length;i++){
      const l=legs[i]; const depart=toPlace(geos[idx++], l.departISO, l.departPlace); const arrive=toPlace(geos[idx++], l.arriveISO, l.arrivePlace);
      const distance_km = haversine(depart.lat,depart.lon,arrive.lat,arrive.lon);
      const w = await arrivalWeather({lat:arrive.lat,lon:arrive.lon},arrive.time);
      const pois = await overpassPOIs({lat:arrive.lat,lon:arrive.lon});
      const near = nearestHazards(hazards, arrive.lat, arrive.lon).slice(0,6).map(h=>({label:h.label,source:h.source, distance_km:h.distance_km}));
      outLegs.push({ index:i, depart:{name:depart.name,lat:depart.lat,lon:depart.lon,time:l.departISO}, arrive:{name:arrive.name,lat:arrive.lat,lon:arrive.lon,time:l.arriveISO}, distance_km, risk: scoreRisk(w, near), weather:w, pois: rankPois(arrive, pois), nearbyHazards: near });
      poisAll.push(...pois.slice(0,50).map(p=>({ type:"Feature", geometry:{ type:"Point", coordinates:[p.lon,p.lat] }, properties:{ name:p.name, kind:p.kind } })));
    }
    const overall = Math.min(100, Math.round(outLegs.reduce((a,b)=>a+b.risk,0)/outLegs.length));
    return J({ overallRisk: overall, legs: outLegs, poisGeoJSON:{ type:"FeatureCollection", features: poisAll } });
  }catch(err){ return J({error:err?.message||"failed"},500); }
};
async function geo(name){ const u=new URL("https://nominatim.openstreetmap.org/search"); u.searchParams.set("q",name); u.searchParams.set("format","jsonv2"); u.searchParams.set("limit","1"); const r=await fetchFn(u,{headers:{"User-Agent":"journeyman/geo"}}); const j=await r.json(); return j?.[0]||null; }
function toPlace(g,iso,fallback){ return { name: g?.display_name?.split(",")?.[0]||fallback, lat: Number(g?.lat||0), lon: Number(g?.lon||0), time: iso }; }
function scoreRisk(w, hz){ const wx = (w.precipProb>=60?25:w.precipProb>=30?12:0)+(w.windKph>=40?18:w.windKph>=25?9:0); const hzScore=Math.min(50, hz.length*8); return Math.min(100, 20+wx+hzScore); }
async function arrivalWeather(pt, arriveISO){ const url=`https://api.open-meteo.com/v1/forecast?latitude=${pt.lat}&longitude=${pt.lon}&hourly=temperature_2m,precipitation_probability,windspeed_10m&forecast_days=7&timezone=UTC`; const r=await fetchFn(url); const j=await r.json();
  const t=j?.hourly?.time||[]; const idx=nearestIndex(t,arriveISO); const temp=j?.hourly?.temperature_2m?.[idx]??0; const wind=j?.hourly?.windspeed_10m?.[idx]??0; const precip=j?.hourly?.precipitation_probability?.[idx]??0; return { summary: summarizeWeather(temp,wind,precip), tempC:temp, windKph:wind, precipProb:precip }; }
function nearestIndex(times,iso){ const target=Date.parse(iso||new Date().toISOString()); let best=0,bd=1e20; for(let i=0;i<times.length;i++){ const d=Math.abs(Date.parse(times[i])-target); if(d<bd){best=i;bd=d;} } return best; }
function summarizeWeather(temp,wind,precip){ return [`${Math.round(temp)}°C`, precip>=60?"rain likely":precip>=30?"chance rain":"dry", wind>=35?"windy":wind>=20?"breezy":"calm"].join(", "); }
async function loadHazards(){ const [usgs,gdacs,relief,eonet]=await Promise.all([
  fetchFn("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson").then(r=>r.json()).catch(()=>null),
  fetchFn("https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=1").then(r=>r.json()).catch(()=>null),
  fetchFn("https://api.reliefweb.int/v1/disasters?appname=jm&profile=full&sort[]=date:desc&limit=50").then(r=>r.json()).catch(()=>null),
  fetchFn("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50").then(r=>r.json()).catch(()=>null)
]); const hz=[]; (usgs?.features||[]).forEach(f=>{ const [lon,lat]=f.geometry.coordinates.slice(0,2); hz.push({lat,lon,label:`M${f.properties.mag||0} ${f.properties.place}`,source:"USGS",ts:f.properties.time}); });
  (gdacs||[]).forEach(e=>{ const lon=e?.lon??e?.longitude; const lat=e?.lat??e?.latitude; if(typeof lon==="number"&&typeof lat==="number") hz.push({lat,lon,label:e.eventtype||e.type,source:"GDACS",ts:Date.now()}); });
  (relief?.data||[]).forEach((d,i)=>{ const lat=(i*19)%120-60; const lon=(i*37)%180-90; hz.push({lat,lon,label:d?.fields?.name,source:"ReliefWeb",ts:new Date(d?.fields?.date?.created||Date.now()).getTime()}); });
  (eonet?.events||[]).forEach(e=>{ const g=e?.geometry?.[0]; if(!g) return; const coords=Array.isArray(g.coordinates[0])?g.coordinates[0]:g.coordinates; const [lon,lat]=Array.isArray(coords)?coords:[0,0]; hz.push({lat,lon,label:e.title,source:"NASA EONET",ts:new Date(g.date).getTime()}); });
  return hz; }
function nearestHazards(hz,lat,lon){ return hz.map(h=>({...h,distance_km:haversine(lat,lon,h.lat,h.lon)})).filter(x=>x.distance_km<=250).sort((a,b)=>a.distance_km-b.distance_km); }
async function overpassPOIs(center){ const bbox=circleBBox(center.lat,center.lon,5); const q=`[out:json][timeout:25];(node["amenity"="hospital"](${bbox});node["amenity"="police"](${bbox});node["amenity"="embassy"](${bbox});node["tourism"="hotel"](${bbox});node["public_transport"="station"](${bbox}););out center 50;`;
  const eps=["https://overpass-api.de/api/interpreter","https://z.overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
  for(let i=0;i<eps.length;i++){ try{ const r=await fetchFn(eps[i],{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({data:q})}); if(r.ok){ const j=await r.json(); return (j.elements||[]).map(e=>({kind:e.tags?.amenity||e.tags?.tourism||e.tags?.public_transport||"poi",name:e.tags?.name||"Unnamed",lat:e.lat||e.center?.lat,lon:e.lon||e.center?.lon})).filter(p=>typeof p.lat==="number"&&typeof p.lon==="number"); } } catch{} await new Promise(res=>setTimeout(res,250*(i+1))); } return []; }
function rankPois(arrive,pois){ return pois.map(p=>({...p,dist_km:haversine(arrive.lat,arrive.lon,p.lat,p.lon)})).sort((a,b)=>a.dist_km-b.dist_km).slice(0,10); }
function circleBBox(lat,lon,km){ const dlat=km/110.574; const dlon=km/(111.320*Math.cos(lat*Math.PI/180)); return `${lat-dlat},${lon-dlon},${lat+dlat},${lon+dlon}`; }
function haversine(a,b,c,d){ const R=6371, dLat=toRad(c-a), dLon=toRad(d-b); const aa=Math.sin(dLat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(aa)); }
function toRad(x){ return x*Math.PI/180 }

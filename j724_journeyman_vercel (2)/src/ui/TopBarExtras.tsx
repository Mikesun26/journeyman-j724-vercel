import React,{useEffect,useRef,useState} from "react"; import { useAppStore } from "../store";
export function LocationToggle(){
  const { geoloc,setGeo,followMe,setFollow }=useAppStore(); const watchId=useRef<number|undefined>(undefined);
  useEffect(()=>()=>{ if(watchId.current!=null) navigator.geolocation.clearWatch(watchId.current); },[]);
  const enable=async()=>{ if(!("geolocation" in navigator)) return alert("Geolocation not supported");
    watchId.current=navigator.geolocation.watchPosition(p=>setGeo({lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy,ts:Date.now()}),err=>alert(err.message),{enableHighAccuracy:true,maximumAge:10000,timeout:20000}); };
  const share=async()=>{ if(!geoloc) return alert("No fix yet"); const text=`My location: ${geoloc.lat.toFixed(5)}, ${geoloc.lon.toFixed(5)} (±${Math.round(geoloc.acc||0)}m) https://maps.google.com/?q=${geoloc.lat},${geoloc.lon}`;
    try{ if(navigator.share){ await navigator.share({title:"My location",text}); } else { await navigator.clipboard.writeText(text); alert("Location copied"); }
      await fetch("/api/share-location",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({lat:geoloc.lat,lon:geoloc.lon,acc:geoloc.acc})}); }catch{} };
  return (<div className="flex items-center gap-2">
    <button onClick={enable} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20">{geoloc?"Loc ✓":"Enable Loc"}</button>
    <label className="flex items-center gap-2 text-sm opacity-90"><input type="checkbox" checked={followMe} onChange={e=>setFollow(e.target.checked)}/> Follow</label>
    <button onClick={share} className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500">Share</button>
  </div>);
}
export function DistressButton(){
  const { geoloc }=useAppStore(); const [pressing,setPressing]=useState(false); const [progress,setProgress]=useState(0); const [confirm,setConfirm]=useState(false);
  const raf=useRef<number|undefined>(); const t0=useRef<number>(0); const holdMs=1500; useEffect(()=>()=>{ if(raf.current) cancelAnimationFrame(raf.current); },[]);
  const down=()=>{ if(confirm) return; setPressing(true); setProgress(0); t0.current=performance.now();
    const tick=(t:number)=>{ const p=Math.min(1,(t-t0.current)/holdMs); setProgress(p); (navigator as any).vibrate?.(p===1?10:0); if(p<1) raf.current=requestAnimationFrame(tick); else { setConfirm(true); setPressing(false); } }; raf.current=requestAnimationFrame(tick); };
  const up=()=>{ if(!confirm){ setPressing(false); setProgress(0); if(raf.current) cancelAnimationFrame(raf.current); } };
  const trackRef=useRef<HTMLDivElement|null>(null); const [dx,setDx]=useState(0);
  const onDrag=(e:React.PointerEvent)=>{ if(!confirm) return; const rect=trackRef.current!.getBoundingClientRect(); const x=Math.max(0,Math.min(rect.width-100,e.clientX-rect.left-50)); setDx(x); };
  const cancelOrSend=async()=>{ if(!confirm) return; const rect=trackRef.current!.getBoundingClientRect(); const cancelZone=rect.width*0.6;
    if(dx<cancelZone){ try{ const rev=geoloc?await fetch(`/api/revgeo?lat=${geoloc.lat}&lon=${geoloc.lon}`).then(r=>r.json()).catch(()=>null):null;
        const payload={ts:new Date().toISOString(),geoloc,rev:rev?.display_name||null,ua:navigator.userAgent};
        const r=await fetch("/api/distress",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)}); const j=await r.json();
        alert(j?.delivered?"SOS sent to your security contact.":"SOS prepared; no webhook configured. Copied to clipboard."); if(!j?.delivered){ const text=`SOS ${payload.ts}\n${geoloc?.lat},${geoloc?.lon}\n${payload.rev??""}`; try{ await navigator.clipboard.writeText(text);}catch{} }
      }catch{ alert("SOS failed."); } }
    setConfirm(false); setDx(0); setProgress(0);
  };
  return (<div className="sos-wrap no-print">
    <button className="sos-btn floaty" onPointerDown={down} onPointerUp={up} onPointerLeave={up} style={{background:"linear-gradient(135deg,#ef4444,#f59e0b)",boxShadow:"0 10px 30px rgba(239,68,68,.5)"}}>SOS
      <div className="sos-ring" style={{['--p' as any]:`${Math.round(progress*100)}%`}}/></button>
    {confirm&&(<div className="sos-confirm"><div ref={trackRef} className="sos-track"><div className="text-sm text-gray-300 px-3">Slide → to CANCEL • Release to SEND</div>
      <div className="sos-knob" style={{transform:`translateX(${dx}px)`}} onPointerDown={e=>(e.currentTarget as any).setPointerCapture(e.pointerId)} onPointerMove={onDrag} onPointerUp={cancelOrSend}>Holded</div></div></div>)}
  </div>);
}

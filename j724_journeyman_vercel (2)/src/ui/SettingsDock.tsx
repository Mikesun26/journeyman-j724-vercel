import React,{useEffect,useState} from "react";
import { useAppStore } from "../store";
import { applySettings } from "../settings";

export default function SettingsDock(){
  const { settings, setSettings } = useAppStore();
  const [open,setOpen]=useState(false);
  useEffect(()=>{ applySettings(settings); },[]);
  return (<>
    <button onClick={()=>setOpen(o=>!o)} className="fixed bottom-8 left-8 btn bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 no-print">⚙️</button>
    {open && (<div className="fixed bottom-28 left-8 w-[min(380px,calc(100vw-2rem))] glass rounded-3xl p-4 z-50 no-print">
      <div className="flex items-center justify-between"><div className="font-bold text-cyan-300">Display Settings</div><button className="text-sm opacity-70 hover:opacity-100" onClick={()=>setOpen(false)}>✕</button></div>
      <div className="mt-3 space-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.compactList} onChange={e=>setSettings({compactList:e.target.checked})}/> Compact itinerary list (phones)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.highContrast} onChange={e=>setSettings({highContrast:e.target.checked})}/> High contrast</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.reduceMotion} onChange={e=>setSettings({reduceMotion:e.target.checked})}/> Reduce motion</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.largeText} onChange={e=>setSettings({largeText:e.target.checked})}/> Large text</label>
      </div>
      <div className="text-[11px] text-gray-400 mt-2">Saved to this device. Takes effect instantly.</div>
    </div>)}
  </>);
}

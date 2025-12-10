import React,{useEffect,useRef,useState} from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../store";
import MapView from "./MapView"; import LayersPanel from "./LayersPanel";
import AdvisoryPanel from "./AdvisoryPanel"; import VaultPanel from "./VaultPanel";
import ItineraryPanel from "./ItineraryPanel"; import SwipeTabs from "./SwipeTabs";
import { connectSSE } from "../lib/sse"; import ChatDock from "./ChatDock";
import SourcesBadge from "./SourcesBadge"; import SettingsDock from "./SettingsDock"; import { LocationToggle, DistressButton } from "./TopBarExtras";
import DueDiligencePanel from "./DueDiligencePanel";
import ControlTowerPanel from "./ControlTowerPanel";

export default function App(){
  const { connected,setConnected,setLastRefreshed,tab } = useAppStore();
  const [status,setStatus]=useState("Ready"); const esRef=useRef<EventSource|null>(null);
  useEffect(()=>{ esRef.current=connectSSE(
    payload=>{ window.dispatchEvent(new CustomEvent("jm:feed",{detail:payload})); setLastRefreshed(Date.now()); },
    ()=>setConnected(true), ()=>setConnected(false)
  ); return ()=>{ esRef.current?.close(); };},[setConnected,setLastRefreshed]);

  return (
    <div className="relative h-screen w-screen">
      <motion.header initial={{y:-40,opacity:0}} animate={{y:0,opacity:1}} transition={{type:"spring",stiffness:80,damping:14}}
        className="fixed top-0 inset-x-0 glass border-b border-white/10 z-40 p-6 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.img initial={{scale:.9}} animate={{scale:1}} transition={{duration:.6}} src="/icons/journeyman-192.png" className="w-12 h-12 rounded-2xl glow"/>
            <h1 className="text-4xl font-black bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">J724 Journeyman</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-lg font-mono text-cyan-300">{connected?"LIVE":"OFFLINE"} • {status}</div>
            <SourcesBadge/><LocationToggle/>
          </div>
        </div>
      </motion.header>

      <SwipeTabs />

      {tab==="map" && <><MapView onStatus={setStatus}/><motion.div initial={{x:-40,opacity:0}} animate={{x:0,opacity:1}} className="fixed top-24 left-6 w-96 glass rounded-3xl p-8 z-30 no-print"><LayersPanel/></motion.div></>}
      {tab==="advisory" && <AnimatedPanel><AdvisoryPanel/></AnimatedPanel>}
      {tab==="vault" && <AnimatedPanel><VaultPanel/></AnimatedPanel>}
      {tab==="itinerary" && <AnimatedPanel><ItineraryPanel/></AnimatedPanel>}
      {tab==="due" && <AnimatedPanel><DueDiligencePanel/></AnimatedPanel>}
      {tab==="tower" && <AnimatedPanel><ControlTowerPanel/></AnimatedPanel>}

      <DistressButton/><ChatDock/><SettingsDock/>
    </div>
  );
}
function AnimatedPanel({children}:{children:React.ReactNode}){ return <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{type:"spring",stiffness:90,damping:16}} className="fixed top-24 left-6 right-6 bottom-8 z-30 overflow-y-auto glass rounded-3xl p-8">{children}</motion.div> }

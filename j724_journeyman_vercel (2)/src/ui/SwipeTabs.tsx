import React,{useEffect,useState} from "react";
import { motion,AnimatePresence } from "framer-motion";
import { useAppStore } from "../store";
const TABS = ["map","advisory","vault","itinerary","due","tower"] as const;
export default function SwipeTabs(){
  const { swipeIndex,setSwipe } = useAppStore(); const [dragX,setDragX]=useState(0); const [hints,setHints]=useState(true);
  useEffect(()=>{ const t=setTimeout(()=>setHints(false),5000); return ()=>clearTimeout(t); },[]);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==="ArrowLeft"){setSwipe(Math.max(0,swipeIndex-1));setHints(false);} if(e.key==="ArrowRight"){setSwipe(Math.min(TABS.length-1,swipeIndex+1));setHints(false);} }; window.addEventListener("keydown",onKey); return ()=>window.removeEventListener("keydown",onKey); },[swipeIndex,setSwipe]);
  return (<>
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 no-print">
      <div className="glass rounded-full p-1 flex items-center gap-1">
        {TABS.map((id,i)=>(<button key={id} onClick={()=>{setSwipe(i);setHints(false);}} className={`tab-pill ${swipeIndex===i?"tab-on":"tab-off"}`}>{id[0].toUpperCase()+id.slice(1)}</button>))}
      </div>
      <AnimatePresence mode="popLayout"><motion.div key={swipeIndex} className="h-1 mt-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" initial={{width:0}} animate={{width:300,transition:{duration:.6}}} exit={{width:0}}/></AnimatePresence>
    </div>
    <motion.div className="fixed inset-0" drag="x" dragConstraints={{left:0,right:0}} onDrag={(e,info)=>setDragX(info.offset.x)} onDragEnd={(e,info)=>{ const thr=90; if(info.offset.x<-thr) setSwipe(Math.min(TABS.length-1,swipeIndex+1)); else if(info.offset.x>thr) setSwipe(Math.max(0,swipeIndex-1)); setDragX(0); setHints(false); }} style={{x:0,opacity:0}}/>
    {hints && swipeIndex>0 && (<div className="hint hint-left"><div className="hint-dot"/><div className="hint-dot"/><div className="hint-dot"/></div>)}
    {hints && swipeIndex<TABS.length-1 && (<div className="hint hint-right"><div className="hint-dot"/><div className="hint-dot"/><div className="hint-dot"/></div>)}
  </>);
}

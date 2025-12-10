import React,{useEffect,useRef} from "react"; import maplibregl from "maplibre-gl";
import { useAppStore } from "../store"; import type { FeatureCollection } from "../types";
export default function MapView({onStatus}:{onStatus:(s:string)=>void}){
  const { layer,report,geoloc,followMe }=useAppStore(); const mapRef=useRef<maplibregl.Map|null>(null);
  useEffect(()=>{ const tiles=[
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"];
    const map=new maplibregl.Map({ container:"jm-map", style:{version:8,sources:{ osm:{type:"raster",tiles,tileSize:256,attribution:"© OpenStreetMap"}, risk:{type:"geojson",data:empty()}, pois:{type:"geojson",data:{type:"FeatureCollection",features:[]}}, you:{type:"geojson",data:{type:"FeatureCollection",features:[]}} }, layers:[
      {id:"osm",type:"raster",source:"osm"},
      {id:"risk",type:"heatmap",source:"risk",paint:{ "heatmap-intensity":1,"heatmap-color":["interpolate",["linear"],["heatmap-density"],0,"rgba(0,0,255,0)",0.3,"#00ff88",0.6,"#ffaa00",1,"#ff0044"],"heatmap-radius":["interpolate",["linear"],["zoom"],0,15,10,60],"heatmap-opacity":.9 }},
      {id:"pois",type:"circle",source:"pois",paint:{ "circle-radius":5,"circle-stroke-width":1,"circle-stroke-color":"#fff","circle-color":["match",["get","kind"],"hospital","#ff4d4d","police","#ffd11a","embassy","#66b3ff","hotel","#a366ff","transit","#33ffcc","#cccccc"] }},
      {id:"you",type:"circle",source:"you",paint:{ "circle-radius":7,"circle-color":"#3b82f6","circle-stroke-color":"#fff","circle-stroke-width":2 }}
    ]}, center:[18,0], zoom:2.15 }); mapRef.current=map; onStatus("Subscribed");
    const onFeed=(e:any)=>{ const payload=(e as CustomEvent).detail as {layer:string;fc:FeatureCollection}; const src=map.getSource("risk") as any; if(src && (payload.layer===layer||payload.layer==="composite")) src.setData(payload.fc); };
    const onPois=()=>{ const src=map.getSource("pois") as any; if(src && report?.poisGeoJSON) src.setData(report.poisGeoJSON); };
    window.addEventListener("jm:feed",onFeed as EventListener); window.addEventListener("jm:pois",onPois as EventListener);
    return ()=>{ window.removeEventListener("jm:feed",onFeed as EventListener); window.removeEventListener("jm:pois",onPois as EventListener); map.remove(); };
  },[layer,onStatus,report]);
  useEffect(()=>{ const map=mapRef.current; if(!map) return; const src=map.getSource("you") as any;
    if(src && geoloc){ src.setData({type:"FeatureCollection",features:[{type:"Feature",geometry:{type:"Point",coordinates:[geoloc.lon,geoloc.lat]},properties:{}}]}); if(followMe) map.flyTo({center:[geoloc.lon,geoloc.lat],zoom:Math.max(map.getZoom(),11),essential:true,speed:.6}); }
  },[geoloc,followMe]);
  return <div id="jm-map" className="absolute inset-0"/>;
}
function empty():FeatureCollection{ return {type:"FeatureCollection",features:[]} }

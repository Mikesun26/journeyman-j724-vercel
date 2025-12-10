import React from "react"; import { useAppStore, type LayerId } from "../store";
export default function LayersPanel(){ const { layer,setLayer } = useAppStore(); const options:LayerId[]=["composite","usgs","gdacs","reliefweb","eonet"];
  return (<div>
    <div className="text-xl font-bold text-cyan-300 mb-2">Layers</div>
    <div className="space-y-2">{options.map(o=>(<label key={o} className="flex items-center gap-2">
      <input type="radio" checked={layer===o} onChange={()=>setLayer(o)}/> <span className="capitalize">{o}</span>
    </label>))}</div>
  </div>);
}

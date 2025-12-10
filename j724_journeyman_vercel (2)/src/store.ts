import { create } from "zustand";
import type { Settings } from "./settings";
import { loadSettings, saveSettings, applySettings } from "./settings";
export type LayerId = "composite"|"usgs"|"gdacs"|"reliefweb"|"eonet";
export type TabId = "map"|"advisory"|"vault"|"itinerary"|"due"|"tower";
export type Leg = { departPlace:string; arrivePlace:string; departISO:string; arriveISO:string; mode:"air"|"sea"|"road"|"rail"; carrier?:string; };
export type ReportLeg = { index:number; depart:{name:string;lat:number;lon:number;time:string}; arrive:{name:string;lat:number;lon:number;time:string}; distance_km:number; risk:number; weather:{summary:string;tempC:number;windKph:number;precipProb:number}; pois:{ type:string; name:string; lat:number; lon:number; dist_km:number }[]; nearbyHazards:{label:string;source:string;distance_km:number}[]; };
export type ItineraryReport = { overallRisk:number; legs: ReportLeg[]; poisGeoJSON:any; };
type CaseItem = { id:string; subject:string; created:number; data:any };
type State = {
  settings: Settings;
  setSettings(s: Partial<Settings>): void;
  connected:boolean; layer:LayerId; tab:TabId; lastRefreshed?:number;
  legs:Leg[]; report?:ItineraryReport;
  geoloc?:{lat:number;lon:number;acc?:number;ts:number}; followMe:boolean;
  swipeIndex:number; cases: CaseItem[];
  setLayer(l:LayerId):void; setTab(t:TabId):void; setSwipe(i:number):void;
  addLeg(l:Leg):void; updateLeg(i:number,p:Partial<Leg>):void; removeLeg(i:number):void; setReport(r?:ItineraryReport):void;
  setLastRefreshed(t:number):void; setConnected(v:boolean):void; setGeo(g?:{lat:number;lon:number;acc?:number;ts:number}):void; setFollow(b:boolean):void;
  addCase(c:CaseItem):void; deleteCase(id:string):void;
};
export const useAppStore = create<State>((set,get)=>({
  connected:false, layer:"composite", tab:"map", swipeIndex:0,
  settings: loadSettings(),
  legs:[{ departPlace:"Johannesburg", arrivePlace:"Dubai", departISO:new Date().toISOString(), arriveISO:new Date(Date.now()+8*3600e3).toISOString(), mode:"air", carrier:"EK" }],
  cases: [],
  setLayer:(layer)=>set({layer}),
  setTab:(tab)=>set({tab, swipeIndex:["map","advisory","vault","itinerary","due","tower"].indexOf(tab)}),
  setSwipe:(i)=>set({ swipeIndex:i, tab:(["map","advisory","vault","itinerary","due","tower"] as TabId[])[i] }),
  addLeg:(l)=>set(s=>({ legs:[...s.legs,l] })), updateLeg:(i,p)=>set(s=>({ legs:s.legs.map((x,ix)=>ix===i?{...x,...p}:x) })), removeLeg:(i)=>set(s=>({ legs:s.legs.filter((_,ix)=>ix!==i) })),
  setReport:(report)=>set({ report }),
  setLastRefreshed:(t)=>set({ lastRefreshed:t }), setConnected:(v)=>set({ connected:v }),
  setGeo:(g)=>set({ geoloc:g }), setFollow:(b)=>set({ followMe:b }),
  addCase:(c)=>set(s=>({ cases:[c, ...s.cases] })), deleteCase:(id)=>set(s=>({ cases:s.cases.filter(x=>x.id!==id) }))
}));

  ,
  setSettings:(s)=>{ const next = { ...get().settings, ...s }; saveSettings(next); applySettings(next); set({ settings: next }); }
}));

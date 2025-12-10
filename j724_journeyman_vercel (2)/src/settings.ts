export type Settings = { compactList: boolean; highContrast: boolean; reduceMotion: boolean; largeText: boolean };
const KEY = "jm:settings";
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { compactList:false, highContrast:false, reduceMotion:false, largeText:false, ...(JSON.parse(raw)||{}) };
  } catch {}
  return { compactList:false, highContrast:false, reduceMotion:false, largeText:false };
}
export function saveSettings(s: Settings){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch{} }
export function applySettings(s: Settings){
  const r = document.documentElement;
  r.setAttribute("data-hc", s.highContrast ? "on" : "off");
  r.setAttribute("data-rm", s.reduceMotion ? "on" : "off");
  r.setAttribute("data-lt", s.largeText ? "lg" : "md");
}

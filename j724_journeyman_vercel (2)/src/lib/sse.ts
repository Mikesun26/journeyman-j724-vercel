export function connectSSE(onData:(p:any)=>void,onOpen:()=>void,onClose:()=>void){
  const es = new EventSource("/api/sse");
  es.onopen = onOpen; es.onerror = onClose;
  es.onmessage = e => { try{ onData(JSON.parse(e.data)); }catch{} };
  return es;
}

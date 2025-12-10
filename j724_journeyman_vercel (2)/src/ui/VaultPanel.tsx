import React,{useState} from "react";
type VaultItem = { id:string; name:string; kind:"passport"|"visa"|"ticket"|"card"|"doc"; data:string };
export default function VaultPanel(){
  const [items,setItems]=useState<VaultItem[]>([]); const [name,setName]=useState(""); const [kind,setKind]=useState<VaultItem["kind"]>("doc"); const [data,setData]=useState("");
  const add=()=>{ if(!name||!data) return; setItems(s=>[...s,{id:crypto.randomUUID(),name,kind,data}]); setName(""); setData(""); };
  return (<div>
    <h2 className="text-3xl font-bold text-cyan-400">Secure Vault</h2>
    <div className="grid md:grid-cols-2 gap-4 mt-4">
      <div className="card">
        <div className="font-semibold mb-2">Add Item</div>
        <input className="input mb-2" placeholder="Name (e.g., Passport – John)" value={name} onChange={e=>setName(e.target.value)}/>
        <select className="input mb-2" value={kind} onChange={e=>setKind(e.target.value as any)}>
          <option value="passport">Passport</option><option value="visa">Visa</option><option value="ticket">Ticket</option><option value="card">Bank Card</option><option value="doc">Document</option>
        </select>
        <textarea className="input h-32" placeholder="Paste masked digits or base64/PDF link (demo)" value={data} onChange={e=>setData(e.target.value)}/>
        <div className="mt-2 flex gap-2"><button className="btn-cta" onClick={add}>Save</button></div>
      </div>
      <div className="card"><div className="font-semibold mb-2">Items</div>
        <ul className="text-sm space-y-2">{items.map(i=>(<li key={i.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between"><div><div className="font-semibold">{i.name}</div><div className="text-xs text-gray-300">{i.kind}</div></div>
          <button className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20" onClick={()=>navigator.clipboard.writeText(i.data)}>Copy</button></li>))}</ul>
      </div>
    </div>
    <div className="text-xs text-gray-400 mt-3">Tip: Back with KMS in production.</div>
  </div>);
}

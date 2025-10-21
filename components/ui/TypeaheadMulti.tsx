"use client";
import { useEffect, useRef, useState } from "react"; import { debounce } from "@/lib/utils/debounce"; import Chips from "./Chips"; import { Field } from "./Field";
export function TypeaheadMulti({label,values,onChange,placeholder,suggestField,required}:{label:string;values:string[];onChange:(v:string[])=>void;placeholder?:string;suggestField:"planType"|"goals"|"flags"|"dietAllergies"|"cuisines"|"equipment";required?:boolean;}){
  const [q,setQ]=useState(""); const [open,setOpen]=useState(false); const [matches,setMatches]=useState<string[]>([]); const [related,setRelated]=useState<string[]>([]); const [cta,setCta]=useState<any>(null); const [i,setI]=useState(0);
  const fetchS = debounce(async (term:string)=>{ const r=await fetch(`/api/suggest?field=${suggestField}&q=${encodeURIComponent(term)}`); const j=await r.json(); setMatches(j.matches||[]); setRelated(j.related||[]); setCta(j.cta||null); setOpen(true); setI(0); },200);
  useEffect(()=>{ if(q.length){ fetchS(q); } else { setOpen(false);} },[q]);
  function add(v:string){ if(!v) return; if(!values.includes(v)) onChange([...values,v]); setQ(""); setOpen(false); }
  function remove(v:string){ onChange(values.filter(x=>x!==v)); }
  function key(e:React.KeyboardEvent<HTMLInputElement>){ if(e.key==="ArrowDown"){ e.preventDefault(); setI(i=>Math.min(i+1,(matches.length-1))); } else if(e.key==="ArrowUp"){ e.preventDefault(); setI(i=>Math.max(i-1,0)); } else if(e.key==="Enter"){ e.preventDefault(); add(matches[i]); } else if(e.key==="Escape"){ setOpen(false);} else if(e.key==="Backspace" && !q && values.length){ remove(values[values.length-1]); } }
  return (<div className="autosuggest">
    <Field label={label} required={required}><Chips values={values} onRemove={remove}/><input className="input" placeholder={placeholder||"Type to search…"} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={key} onFocus={()=>q&&setOpen(true)}/></Field>
    {open&&(<div className="as-panel">
      {matches.map((m,idx)=>(<div key={m} className="as-item" data-active={idx===i?"true":"false"} onMouseDown={()=>add(m)}>{m}</div>))}
      {related.length>0&&(<div className="as-section">Related searches</div>)}
      {related.map(r=>(<div key={r} className="as-item" onMouseDown={()=>add(r)}>{r}</div>))}
      <div className="as-section">
        {cta && <button className="btn ghost" onMouseDown={(e)=>{e.preventDefault(); if(cta.payload?.plan_type){ if(cta.payload.plan_type.primary) add(cta.payload.plan_type.primary); (cta.payload.plan_type.secondary||[]).forEach(add); } (cta.payload.goals||[]).forEach(add); }}>Use this example</button>}
        {!cta && <span className="helper">No match? Press Enter to add free text.</span>}
      </div>
    </div>)}
  </div>);
}
"use client";
export function Field({label,required,helper,children}:{label:string;required?:boolean;helper?:string;children:React.ReactNode}){ return (
  <label className="grid" style={{gap:6}}>
    <span style={{fontSize:12,color:"#6b7280"}}>{label}{required&&<span style={{marginLeft:6}} className="cta-pill">Required</span>}</span>
    {children}{helper&&<span className="helper">{helper}</span>}
  </label>
); }
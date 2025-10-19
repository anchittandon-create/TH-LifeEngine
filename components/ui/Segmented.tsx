"use client";
export default function Segmented({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}) {
  return <div role="tablist" className="inline-flex rounded-xl border bg-white p-1">
    {options.map(o=>{const a=value===o.value; return (
      <button key={o.value} role="tab" aria-selected={a} data-active={a?"true":"false"}
        onClick={()=>onChange(o.value)} className="px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 data-[active=true]:bg-gray-900 data-[active=true]:text-white">
        {o.label}
      </button> );})}
  </div>;
}

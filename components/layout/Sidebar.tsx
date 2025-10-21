"use client";
import NavLink from "./NavLink";
const NAV:[string,string][]= [["/lifeengine","Home"],["/lifeengine/profiles","Profiles"],["/lifeengine/create","Create Plan"],["/lifeengine/chat","Use Our CustomGPT"],["/lifeengine/dashboard","Dashboard"],["/lifeengine/settings","Settings"]];
export default function Sidebar(){ return (<aside className="sidebar"><div style={{padding:"0 12px",fontSize:12,color:"#6b7280",textTransform:"uppercase"}}>Navigation</div><nav aria-label="Main">{NAV.map(([h,l])=><NavLink key={h} href={h} label={l}/>)}</nav></aside>); }

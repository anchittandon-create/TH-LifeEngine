"use client";
import NavLink from "./NavLink";
const NAV=[["/lifeengine","Home"],["/lifeengine/profiles","Profiles"],["/lifeengine/create","Create Plan"],["/lifeengine/dashboard","Dashboard"],["/lifeengine/settings","Settings"]];
export default function Sidebar(){
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 border-r bg-white">
      <div className="p-3 text-xs uppercase tracking-wide text-gray-500">Navigation</div>
      <nav className="px-2 pb-4 space-y-1" aria-label="Main">
        {NAV.map(([href,label]) => <NavLink key={href} href={href} label={label} />)}
      </nav>
    </aside>
  );
}

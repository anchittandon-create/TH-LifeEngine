"use client";
import { useEffect, useState } from "react";
import NavLink from "./NavLink";

const NAV:[string,string][]= [["/lifeengine","Home"],["/lifeengine/profiles","Profiles"],["/lifeengine/create","Create Plan"],["/lifeengine/chat","Use Our CustomGPT"],["/lifeengine/dashboard","Dashboard"],["/lifeengine/settings","Settings"]];

export default function Sidebar() {
  const [rootUser, setRootUser] = useState<any>(null);

  useEffect(() => {
    // Initialize root user on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('th_lifeengine_root_user');
      if (stored) {
        const user = JSON.parse(stored);
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('th_lifeengine_root_user', JSON.stringify(user));
        setRootUser(user);
      } else {
        // Create root user
        const newUser = {
          id: `root_${Date.now()}`,
          username: 'root',
          email: 'root@thlifeengine.com',
          role: 'root',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem('th_lifeengine_root_user', JSON.stringify(newUser));
        setRootUser(newUser);
      }
    }
  }, []);

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ padding: "0 12px", fontSize: 12, color: "#6b7280", textTransform: "uppercase" }}>
        Navigation
      </div>
      <nav aria-label="Main" style={{ flex: 1 }}>
        {NAV.map(([h, l]) => <NavLink key={h} href={h} label={l} />)}
      </nav>
      
      {/* Root User Display */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
        fontSize: '12px',
        color: '#6B7280'
      }}>
        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px', fontSize: '13px' }}>
          👤 {rootUser?.username || 'Loading...'}
        </div>
        <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
          {rootUser?.email}
        </div>
        <div style={{ fontSize: '10px', color: '#16A34A', marginTop: '4px', fontWeight: '600' }}>
          {rootUser?.role?.toUpperCase()}
        </div>
        {rootUser?.lastLogin && (
          <div style={{ fontSize: '9px', color: '#9CA3AF', marginTop: '4px' }}>
            Last login: {new Date(rootUser.lastLogin).toLocaleTimeString()}
          </div>
        )}
      </div>
    </aside>
  );
}

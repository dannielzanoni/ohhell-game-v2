import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar.jsx';

export function AppLayout() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar
        isCollapsed={isNavCollapsed}
        onToggle={() => setIsNavCollapsed((current) => !current)}
      />
      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          isNavCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar.jsx';

const NAV_COLLAPSED_STORAGE_KEY = 'ohhell_nav_collapsed';

function getSavedNavCollapsed() {
  try {
    return localStorage.getItem(NAV_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function AppLayout() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(getSavedNavCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(
        NAV_COLLAPSED_STORAGE_KEY,
        String(isNavCollapsed),
      );
    } catch {
      // Ignore storage failures and keep the menu usable.
    }
  }, [isNavCollapsed]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar
        isCollapsed={isNavCollapsed}
        onToggle={() => setIsNavCollapsed((current) => !current)}
      />
      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          isNavCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}

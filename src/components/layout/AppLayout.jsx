import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DesktopSidebar } from './NavBar.jsx';
import { MobileNavigation } from './MobileNavigation.jsx';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';

function getSavedNavCollapsed() {
  return storage.getItem(storageKeys.navCollapsed) === 'true';
}

export function AppLayout() {
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(getSavedNavCollapsed);

  useEffect(() => {
    storage.setItem(storageKeys.navCollapsed, String(isNavCollapsed));
  }, [isNavCollapsed]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileNavigation />
      <DesktopSidebar
        isCollapsed={isNavCollapsed}
        onToggle={() => setIsNavCollapsed((current) => !current)}
      />
      <div
        className={`min-h-screen transition-[padding] duration-300 ${location.pathname.startsWith('/game/') ? 'pb-0' : 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]'} md:pb-0 ${
          isNavCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}

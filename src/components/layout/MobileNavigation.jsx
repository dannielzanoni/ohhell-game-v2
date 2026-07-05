import { useState } from 'react';
import { Crown, Home, Menu, Moon, Play, Settings, Sun, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useTheme } from '@/app/provider.jsx';
import { pageLinks } from '@/app/routes/pageLinks.js';
import aceIcon from '@/assets/icons/ace.svg';
import { LanguageSettingsModal } from '@/components/i18n/LanguageSwitcher.jsx';
import { GameSettingsModal } from '@/components/settings/GameSettingsModal.jsx';
import { cn } from '@/lib/utils.js';

const primaryItems = [
  { icon: Home, labelKey: 'common.home', path: '/' },
  { icon: Play, labelKey: 'pages.links.createGame.label', path: '/create-game' },
  { icon: Users, labelKey: 'pages.links.rooms.label', path: '/rooms' },
  { icon: Crown, labelKey: 'pages.links.leaderboard.label', path: '/leaderboard' },
];
const secondaryItems = pageLinks.filter((item) =>
  ['/how-to-play', '/github'].includes(item.path),
);

export function MobileNavigation() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-border bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <NavLink to="/" className="flex min-h-11 items-center gap-2 font-bold">
          <img src={aceIcon} alt="" className="size-8 rounded-md" />
          <span>{t('common.appName')}</span>
        </NavLink>
        <button
          type="button"
          aria-controls="mobile-navigation-drawer"
          aria-expanded={drawerOpen}
          aria-label={t('nav.openMenu')}
          className="grid size-11 place-items-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </header>

      <nav
        aria-label={t('nav.mobileNavigation')}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur md:hidden"
      >
        {primaryItems.map(({ icon: Icon, labelKey, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => cn(
              'flex min-h-14 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-[0.65rem] font-semibold text-muted-foreground',
              isActive && 'text-primary',
            )}
          >
            <Icon className="size-5" />
            <span className="max-w-full truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={t('nav.closeMenu')}
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.more')}
            className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-card px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl"
          >
            <div className="flex min-h-14 items-center justify-between border-b border-border">
              <strong>{t('nav.more')}</strong>
              <button
                type="button"
                aria-label={t('nav.closeMenu')}
                className="grid size-11 place-items-center rounded-md hover:bg-muted"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2 py-4">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const classes = 'flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold hover:bg-muted';
                return item.externalUrl ? (
                  <a key={item.path} href={item.externalUrl} className={classes}>
                    <i className={item.primeIcon} aria-hidden="true" />
                    {t(item.labelKey)}
                  </a>
                ) : (
                  <NavLink key={item.path} to={item.path} className={classes} onClick={() => setDrawerOpen(false)}>
                    <Icon className="size-5" />
                    {t(item.labelKey)}
                  </NavLink>
                );
              })}
              <button type="button" className="flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold hover:bg-muted" onClick={() => setSettingsOpen(true)}>
                <Settings className="size-5" /> {t('settings.title')}
              </button>
              <button type="button" className="flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold hover:bg-muted" onClick={() => setLanguageOpen(true)}>
                <span className="grid size-5 place-items-center font-black">文</span> {t('settings.language')}
              </button>
              <button type="button" className="flex min-h-11 items-center gap-3 rounded-md px-3 font-semibold hover:bg-muted" onClick={toggleTheme}>
                {theme === 'dark' ? <Moon className="size-5" /> : <Sun className="size-5" />}
                {t('nav.toggleTheme')}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <GameSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <LanguageSettingsModal open={languageOpen} onOpenChange={setLanguageOpen} />
    </>
  );
}

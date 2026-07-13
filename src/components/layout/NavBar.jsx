import { useState } from 'react';
import {
  Home,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useTheme } from '@/app/provider.jsx';
import { pageLinks } from '@/app/routes/pageLinks.js';
import aceIcon from '@/assets/icons/ace.svg';
import {
  LanguageNavButton,
  LanguageSettingsModal,
} from '@/components/i18n/LanguageSwitcher.jsx';
import { GameSettingsModal } from '@/components/settings/GameSettingsModal.jsx';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

export function NavBar({ isCollapsed, onToggle }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navItems = [
    { label: 'Home', labelKey: 'common.home', path: '/home', icon: Home },
    ...pageLinks,
  ];

  return (
    <>
      {isCollapsed ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('nav.expandMenu')}
          className="fixed left-3 top-3 z-50 size-11 cursor-pointer border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-black/20 backdrop-blur hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
          onClick={onToggle}
        >
          <PanelLeftOpen className="size-5" />
        </Button>
      ) : null}

      {!isCollapsed ? (
        <button
          type="button"
          aria-label={t('nav.closeMenu')}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={onToggle}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-black/10 backdrop-blur transition-[width] duration-300',
          isCollapsed ? 'hidden w-20 md:flex' : 'w-64',
        )}
      >
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-4">
        <NavLink
          to="/"
          className={cn(
            'flex min-w-0 items-center gap-3 rounded-md text-sidebar-foreground',
            isCollapsed && 'justify-center',
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-sidebar-primary">
            <img
              src={aceIcon}
              alt=""
              className="size-full object-cover"
              draggable="false"
            />
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{t('common.appName')}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {t('nav.gameHub')}
              </span>
            </span>
          )}
        </NavLink>

        {!isCollapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('nav.minimizeMenu')}
            className="cursor-pointer"
            onClick={onToggle}
          >
            <PanelLeftClose />
          </Button>
        )}
      </div>

      {isCollapsed && (
        <Button
          type="button"
          variant="ghost"
          size="default"
          aria-label={t('nav.expandMenu')}
          className="mx-3 mt-4 h-11 w-auto cursor-pointer justify-center px-0 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onToggle}
        >
          <PanelLeftOpen />
        </Button>
      )}

      <nav className="flex flex-1 flex-col gap-2 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label = item.labelKey ? t(item.labelKey) : item.label;
          const content = (
            <>
              {Icon ? (
                <Icon className="size-4 shrink-0" />
              ) : item.primeIcon ? (
                <i className={cn(item.primeIcon, 'shrink-0 text-base')} />
              ) : (
                <img
                  src={item.iconSrc}
                  alt=""
                  className="size-4 shrink-0 object-contain"
                />
              )}
              {!isCollapsed && <span>{label}</span>}
            </>
          );

          if (item.externalUrl) {
            return (
              <a
                key={item.path}
                href={item.externalUrl}
                target="_blank"
                rel="noreferrer"
                title={isCollapsed ? label : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center px-0',
                )}
              >
                {content}
              </a>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center px-0',
                )
              }
            >
              {content}
            </NavLink>
          );
        })}

        <button
          type="button"
          title={isCollapsed ? t('settings.title') : undefined}
          className={cn(
            'flex h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isCollapsed && 'justify-center px-0',
          )}
          onClick={() => setIsSettingsOpen(true)}
        >
          <SettingsIcon className="size-4 shrink-0" />
          {!isCollapsed && <span>{t('settings.title')}</span>}
        </button>

        <LanguageNavButton
          isCollapsed={isCollapsed}
          onClick={() => setIsLanguageOpen(true)}
        />
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          type="button"
          variant="outline"
          className={cn('w-full cursor-pointer', isCollapsed && 'px-0')}
          title={isCollapsed ? t('nav.toggleTheme') : undefined}
          aria-label={t('nav.toggleTheme')}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Moon /> : <Sun />}
          {!isCollapsed && (
            <span>
              {theme === 'dark' ? t('nav.darkTheme') : t('nav.lightTheme')}
            </span>
          )}
        </Button>
      </div>

      <GameSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        variant="classic"
      />
      <LanguageSettingsModal
        open={isLanguageOpen}
        onOpenChange={setIsLanguageOpen}
      />
      </aside>
    </>
  );
}

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { ResilientImage } from '@/components/ui/resilient-image.jsx';
import { cn } from '@/lib/utils.js';
import { avatarGroups } from '@/assets/catalog/avatarCatalog.js';

export { avatarGroups, avatars } from './avatarOptions.js';

export function AvatarEditModal({ isOpen, selectedAvatar, onClose, onSelect }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex min-h-[100dvh] items-end justify-center bg-black/70 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-edit-title"
        className="flex max-h-[calc(100dvh-max(1rem,env(safe-area-inset-top)))] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card pb-[env(safe-area-inset-bottom)] text-card-foreground shadow-2xl shadow-black/40 sm:h-[min(42rem,88vh)] sm:max-w-2xl sm:rounded-lg sm:pb-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="avatar-edit-title" className="text-base font-bold sm:text-xl">
            {t('auth.avatarModalTitle')}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('auth.closeModal')}
            className="cursor-pointer"
            onClick={onClose}
          >
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          {avatarGroups.map((group) => (
            <div key={group.title} className="not-first:mt-6 sm:not-first:mt-7">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
                {t(group.labelKey)}
              </h3>
              <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-x-2 gap-y-3 min-[380px]:grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] sm:mt-4 sm:grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] sm:gap-4">
                {group.avatars.map((avatar) => {
                  const isSelected = selectedAvatar?.id === avatar.id;

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      aria-label={t('auth.selectAvatarAria', {
                        label: avatar.label,
                      })}
                      className={cn(
                        'mx-auto grid size-11 min-w-0 cursor-pointer place-items-center rounded-full p-0.5 ring-2 ring-transparent transition hover:scale-105 hover:ring-primary/70 focus:outline-none focus:ring-4 focus:ring-ring min-[380px]:size-12 sm:size-16 sm:p-1',
                        isSelected && 'ring-primary',
                      )}
                      onClick={() => {
                        onSelect(avatar);
                        onClose();
                      }}
                    >
                      <span className="block size-full overflow-hidden rounded-full border border-border bg-muted shadow-sm">
                        <ResilientImage
                          src={avatar.src}
                          alt=""
                          className="block h-full w-full scale-110 object-cover"
                          draggable="false"
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

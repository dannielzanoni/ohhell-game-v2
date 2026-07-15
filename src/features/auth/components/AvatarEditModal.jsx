import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button.jsx';
import { cn } from '@/shared/lib/utils.js';
import { avatarGroups } from './avatarOptions.js';

export { avatarGroups, avatars } from './avatarOptions.js';

export function AvatarEditModal({
  isOpen,
  selectedAvatar,
  onClose,
  onSelect,
  variant = 'default',
}) {
  const { t } = useTranslation();
  const isHellHand = variant === 'hellHand';

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

  if (typeof document === 'undefined') {
    return null;
  }

  const modal = (
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[80] flex min-h-[100dvh] items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4',
        isHellHand && 'z-[100] bg-black/85 p-3 sm:p-5',
      )}
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-edit-title"
        className={cn(
          'flex h-[min(50.4rem,calc(100dvh-1rem))] w-full max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-2xl shadow-black/40 sm:max-h-[96vh] sm:max-w-2xl',
          isHellHand &&
            'h-[min(50.4rem,calc(100dvh-1.5rem))] w-[min(48rem,calc(100vw-1.5rem))] max-w-none rounded-lg border-red-200/15 bg-black/90 text-stone-100 shadow-black/70 sm:h-[min(55.2rem,calc(100dvh-2.5rem))] sm:w-[min(64rem,calc(100vw-2.5rem))]',
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header
          className={cn(
            'flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4',
            isHellHand && 'border-red-200/15 bg-red-950/20',
          )}
        >
          <h2 id="avatar-edit-title" className="text-base font-bold sm:text-xl">
            {t('auth.avatarModalTitle')}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('auth.closeModal')}
            className={cn(
              'cursor-pointer',
              isHellHand &&
                'text-red-100 hover:bg-red-700/30 hover:text-white',
            )}
            onClick={onClose}
          >
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          {avatarGroups.map((group) => (
            <div key={group.title} className="not-first:mt-6 sm:not-first:mt-7">
              <h3
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm',
                  isHellHand && 'text-red-100/65',
                )}
              >
                {group.title === 'Avatares' ? t('auth.avatars') : group.title}
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
                        isHellHand &&
                          'hover:ring-red-300/80 focus:ring-red-500/45',
                        isHellHand && isSelected && 'ring-red-400',
                      )}
                      onClick={() => {
                        onSelect(avatar);
                        onClose();
                      }}
                    >
                      <span className="block size-full overflow-hidden rounded-full border border-border bg-muted shadow-sm">
                        <img
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

  return createPortal(modal, document.body);
}

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

const pngAvatars = import.meta.glob('../../assets/profile_pictures/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

const gifAvatars = import.meta.glob('../../assets/profile_pictures/gifs/*.gif', {
  eager: true,
  import: 'default',
  query: '?url',
});

function avatarNumber(path) {
  return Number(path.match(/(\d+)\.(png|gif)$/)?.[1] || 0);
}

function toAvatarList(entries, type) {
  return Object.entries(entries)
    .map(([path, src]) => ({
      id: `${type}-${avatarNumber(path)}`,
      label: `${type.toUpperCase()} ${avatarNumber(path)}`,
      src,
      type,
      order: avatarNumber(path),
    }))
    .sort((first, second) => first.order - second.order);
}

export const avatarGroups = [
  {
    title: 'Avatares',
    avatars: toAvatarList(pngAvatars, 'png'),
  },
  {
    title: 'GIFs',
    avatars: toAvatarList(gifAvatars, 'gif'),
  },
];

export const avatars = avatarGroups.flatMap((group) => group.avatars);

export function AvatarEditModal({ isOpen, selectedAvatar, onClose, onSelect }) {
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
      className="fixed inset-0 z-[80] flex min-h-screen items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-edit-title"
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-2xl shadow-black/40"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="avatar-edit-title" className="text-xl font-bold">
            Selecione seu Avatar:
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar modal"
            className="cursor-pointer"
            onClick={onClose}
          >
            <X />
          </Button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          {avatarGroups.map((group) => (
            <div key={group.title} className="not-first:mt-7">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h3>
              <div className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
                {group.avatars.map((avatar) => {
                  const isSelected = selectedAvatar?.id === avatar.id;

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      aria-label={`Selecionar avatar ${avatar.label}`}
                      className={cn(
                        'grid cursor-pointer place-items-center rounded-full p-1 ring-2 ring-transparent transition hover:scale-105 hover:ring-primary/70 focus:outline-none focus:ring-4 focus:ring-ring',
                        isSelected && 'ring-primary',
                      )}
                      onClick={() => {
                        onSelect(avatar);
                        onClose();
                      }}
                    >
                      <img
                        src={avatar.src}
                        alt=""
                        className="size-16 rounded-full border border-border object-cover shadow-sm"
                      />
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

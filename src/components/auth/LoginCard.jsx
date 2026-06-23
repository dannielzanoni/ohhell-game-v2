import { useState } from 'react';
import { Pencil, UserRound } from 'lucide-react';
import { AvatarEditModal, avatars } from './AvatarEditModal.jsx';
import { Button } from '@/components/ui/button.jsx';
import { TypingAnimation } from '@/components/ui/typing-animation.jsx';
import { cn } from '@/lib/utils.js';

function GoogleLogo() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.805 10.023h-9.62v3.955h5.536c-.239 1.271-.957 2.35-2.036 3.066v2.548h3.294c1.928-1.775 3.041-4.39 3.041-7.49 0-.71-.064-1.397-.215-2.079z"
      />
      <path
        fill="#34A853"
        d="M12.185 22c2.754 0 5.064-.91 6.753-2.469l-3.294-2.548c-.91.607-2.074.973-3.459.973-2.658 0-4.91-1.79-5.714-4.197H3.065v2.628C4.738 19.714 8.176 22 12.185 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.471 13.759a5.92 5.92 0 0 1 0-3.518V7.613H3.065a10.005 10.005 0 0 0 0 8.774l3.406-2.628z"
      />
      <path
        fill="#EA4335"
        d="M12.185 6.044c1.497 0 2.841.514 3.9 1.526l2.925-2.925C17.249 3.006 14.939 2 12.185 2 8.176 2 4.738 4.286 3.065 7.613l3.406 2.628c.804-2.407 3.056-4.197 5.714-4.197z"
      />
    </svg>
  );
}

export function LoginCard({ className }) {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    const savedAvatarId = localStorage.getItem('ohhell_guest_avatar_id');

    return avatars.find((avatar) => avatar.id === savedAvatarId) || null;
  });
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('ohhell_guest_nickname') || '';
  });
  const [savedNickname, setSavedNickname] = useState(() => {
    return localStorage.getItem('ohhell_guest_nickname') || '';
  });

  const saveNickname = () => {
    const nextNickname = nickname.trim();

    localStorage.setItem('ohhell_guest_nickname', nextNickname);
    setNickname(nextNickname);
    setSavedNickname(nextNickname);
  };

  const trimmedNickname = nickname.trim();
  const canSaveNickname = trimmedNickname !== savedNickname;
  const displayNickname = trimmedNickname || savedNickname || 'Guest';
  const shouldAnimateNickname = Boolean(savedNickname) && !canSaveNickname;
  const selectAvatar = (avatar) => {
    localStorage.setItem('ohhell_guest_avatar_id', avatar.id);
    setSelectedAvatar(avatar);
  };

  return (
    <>
      <section
        className={cn(
          'rounded-lg border border-border bg-card p-6 shadow-sm',
          className,
        )}
      >
        <span className="mb-4 block w-full text-center text-xs font-semibold leading-5 text-muted-foreground">
          Jogar como Guest
        </span>
        <div className="flex items-center gap-4">
          <div className="flex w-20 shrink-0 flex-col items-center gap-2">
            <button
              type="button"
              aria-label="Editar avatar guest"
              className="group relative grid size-14 shrink-0 cursor-pointer place-items-center rounded-full bg-secondary ring-2 ring-border transition hover:bg-primary hover:text-primary-foreground hover:ring-primary/60 focus:outline-none focus:ring-4 focus:ring-ring"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              {selectedAvatar ? (
                <img
                  src={selectedAvatar.src}
                  alt=""
                  className="absolute inset-0 size-full rounded-full object-cover"
                />
              ) : (
                <UserRound className="size-7 text-muted-foreground transition group-hover:text-primary-foreground" />
              )}
              <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <Pencil className="size-3" />
              </span>
            </button>
            <span className="text-center text-xs font-semibold leading-4 text-muted-foreground">
              Selecione seu Avatar
            </span>
          </div>

          <div className="min-w-0 flex-1 self-start pt-1 mt-2">
            <div className="min-h-8 truncate text-2xl font-medium leading-none text-foreground">
              {shouldAnimateNickname ? (
                <TypingAnimation
                  key={savedNickname}
                  words={[savedNickname]}
                  typeSpeed={45}
                  startOnView={false}
                  className="font-medium leading-none tracking-tight"
                />
              ) : (
                <span>{displayNickname}</span>
              )}
            </div>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-muted-foreground">Nick</span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              name="nickname"
              maxLength={24}
              value={nickname}
              placeholder="Digite seu nick"
              className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
              onChange={(event) => setNickname(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  saveNickname();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Salvar nick"
              disabled={!canSaveNickname}
              className="h-11 w-11 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              onClick={saveNickname}
            >
              <i className="pi pi-save text-base" />
            </Button>
          </div>
        </label>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            ou
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full cursor-pointer gap-3"
        >
          <GoogleLogo />
          Login com Google
        </Button>
      </section>

      <AvatarEditModal
        isOpen={isAvatarModalOpen}
        selectedAvatar={selectedAvatar}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={selectAvatar}
      />
    </>
  );
}

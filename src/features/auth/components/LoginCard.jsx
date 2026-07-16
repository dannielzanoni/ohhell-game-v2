import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LogOut, Maximize2, Minus, Pencil, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AvatarEditModal } from './AvatarEditModal.jsx';
import googleIcon from '@/shared/assets/icons/google.svg';
import { Button } from '@/shared/ui/button.jsx';
import { TypingAnimation } from '@/shared/ui/typing-animation.jsx';
import { environment } from '@/shared/config/environment.js';
import { cn } from '@/shared/lib/utils.js';
import { authService } from '@/features/auth/api/authService.js';
import { avatars, resolveAvatar } from '@/features/auth/model/avatarRegistry.js';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Identity Services is unavailable.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Identity Services.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });
}

function GoogleLogo() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

function getSavedAvatar() {
  const savedAvatarId = localStorage.getItem('ohhell_guest_avatar_id');

  return avatars.find((avatar) => avatar.id === savedAvatarId) || null;
}

function getInitialProfile() {
  const profile = authService.getCurrentProfile();

  return {
    avatar: resolveAvatar(profile.picture) || getSavedAvatar(),
    isGoogle: profile.isGoogle,
    nickname: profile.nickname || localStorage.getItem('ohhell_guest_nickname') || '',
  };
}

export const LoginCard = forwardRef(function LoginCard(
  {
    className,
    onProfileStateChange,
    onSaved,
    variant = 'default',
    compact = false,
    minimizable = false,
    defaultMinimized = false,
  },
  ref,
) {
  const { t } = useTranslation();
  const googleButtonRef = useRef(null);
  const initialProfileRef = useRef(null);
  const isHellHand = variant === 'hellHand';

  if (!initialProfileRef.current) {
    initialProfileRef.current = getInitialProfile();
  }

  const [hasAuthToken, setHasAuthToken] = useState(() => Boolean(authService.getAuthToken()));
  const [isGoogleAuth, setIsGoogleAuth] = useState(() => initialProfileRef.current.isGoogle);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(() => initialProfileRef.current.avatar);
  const [savedAvatarId, setSavedAvatarId] = useState(() => {
    return initialProfileRef.current.avatar?.id || '';
  });
  const [nickname, setNickname] = useState(() => {
    return initialProfileRef.current.nickname;
  });
  const [savedNickname, setSavedNickname] = useState(() => {
    return initialProfileRef.current.nickname;
  });
  const [googleError, setGoogleError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const showMinimized = minimizable && isMinimized;

  const syncProfileFromAuth = useCallback(() => {
    const profile = authService.getCurrentProfile();
    const profileAvatar = resolveAvatar(profile.picture);
    const nextNickname = profile.nickname || '';
    const nextAvatarId = profileAvatar?.id || '';

    if (nextNickname) {
      setNickname(nextNickname);
      setSavedNickname(nextNickname);
    }

    if (profileAvatar) {
      setSelectedAvatar(profileAvatar);
      setSavedAvatarId(nextAvatarId);
    }

    setHasAuthToken(Boolean(authService.getAuthToken()));
    setIsGoogleAuth(profile.isGoogle);

    return {
      avatar: profileAvatar,
      nickname: nextNickname || 'Guest',
      token: authService.getAuthToken(),
    };
  }, []);

  const saveGuestProfile = useCallback(async () => {
    const nextNickname = nickname.trim();
    const nextAvatarId = selectedAvatar?.id || '';
    const picture = selectedAvatar?.picture || '';
    const payload = {
      nickname: nextNickname || 'Guest',
      picture,
    };

    setIsSaving(true);
    setSaveError('');

    try {
      const response = await authService.saveGuestProfile(payload);

      localStorage.setItem('ohhell_guest_nickname', nextNickname);
      if (nextAvatarId) {
        localStorage.setItem('ohhell_guest_avatar_id', nextAvatarId);
      } else {
        localStorage.removeItem('ohhell_guest_avatar_id');
      }

      setNickname(nextNickname);
      setSavedNickname(nextNickname);
      setSavedAvatarId(nextAvatarId);
      setHasAuthToken(Boolean(authService.getAuthToken()));
      setIsGoogleAuth(authService.isGoogleAuthenticated());
      onSaved?.({
        avatarId: nextAvatarId,
        nickname: nextNickname || 'Guest',
        token: response?.token || authService.getAuthToken(),
      });
    } catch (error) {
      setSaveError(error.message || t('auth.saveProfileError'));
    } finally {
      setIsSaving(false);
    }
  }, [nickname, onSaved, selectedAvatar, t]);

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) {
        return;
      }

      setIsGoogleSubmitting(true);
      setGoogleError('');

      try {
        const loginResponse = await authService.loginWithGoogle(response.credential);
        const profile = syncProfileFromAuth();

        onSaved?.({
          avatarId: profile.avatar?.id || '',
          nickname: profile.nickname,
          token: loginResponse?.token || profile.token,
        });
      } catch (error) {
        setGoogleError(error.message || t('auth.googleLoginError'));
      } finally {
        setIsGoogleSubmitting(false);
      }
    },
    [onSaved, syncProfileFromAuth, t],
  );

  const handleGoogleLogout = useCallback(() => {
    authService.clearAuthToken();
    window.google?.accounts?.id?.disableAutoSelect?.();

    const guestAvatar = getSavedAvatar();
    const guestNickname = localStorage.getItem('ohhell_guest_nickname') || '';
    const guestAvatarId = guestAvatar?.id || '';

    setHasAuthToken(false);
    setIsGoogleAuth(false);
    setSelectedAvatar(guestAvatar);
    setSavedAvatarId(guestAvatarId);
    setNickname(guestNickname);
    setSavedNickname(guestNickname);
    setGoogleError('');
    setSaveError('');

    onSaved?.({
      avatarId: guestAvatarId,
      nickname: guestNickname || 'Guest',
      token: null,
    });
  }, [onSaved]);

  const trimmedNickname = nickname.trim();
  const selectedAvatarId = selectedAvatar?.id || '';
  const canSaveProfile =
    !hasAuthToken || trimmedNickname !== savedNickname || selectedAvatarId !== savedAvatarId;
  const displayNickname = trimmedNickname || savedNickname || 'Guest';
  const shouldAnimateNickname = Boolean(savedNickname) && !canSaveProfile;
  const canRenderGoogleLogin = Boolean(environment.googleClientId) && !isGoogleAuth;
  const selectAvatar = (avatar) => {
    localStorage.setItem('ohhell_guest_avatar_id', avatar.id);
    setSelectedAvatar(avatar);
    setSaveError('');
  };

  useImperativeHandle(
    ref,
    () => ({
      saveIfNeeded: () => {
        if (canSaveProfile) {
          return saveGuestProfile();
        }

        return Promise.resolve({
          avatarId: selectedAvatarId,
          nickname: displayNickname,
          token: authService.getAuthToken(),
        });
      },
    }),
    [canSaveProfile, displayNickname, selectedAvatarId, saveGuestProfile],
  );

  useEffect(() => {
    onProfileStateChange?.({
      canSaveProfile,
      hasAuthToken,
      isSaving,
      saveError,
    });
  }, [canSaveProfile, hasAuthToken, isSaving, onProfileStateChange, saveError]);

  useEffect(() => {
    if (!canRenderGoogleLogin) {
      return undefined;
    }

    let isMounted = true;

    setIsGoogleLoading(true);
    setGoogleError('');

    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted || !googleButtonRef.current || !window.google?.accounts?.id) {
          return;
        }

        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          showMinimized
            ? {
                shape: 'circle',
                size: 'medium',
                theme: 'outline',
                type: 'icon',
              }
            : {
                shape: 'pill',
                size: compact ? 'medium' : 'large',
                text: 'continue_with',
                theme: 'outline',
                width: compact ? 210 : 260,
              },
        );
      })
      .catch(() => {
        if (isMounted) {
          setGoogleError(t('auth.googleUnavailable'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsGoogleLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canRenderGoogleLogin, compact, handleGoogleCredential, showMinimized, t]);

  const avatarButton = (
    <button
      type="button"
      aria-label={t('auth.editGuestAvatar')}
      className={cn(
        'group relative grid size-14 shrink-0 cursor-pointer place-items-center rounded-full bg-secondary ring-2 ring-border transition hover:bg-primary hover:text-primary-foreground hover:ring-primary/60 focus:outline-none focus:ring-4 focus:ring-ring',
        compact && 'size-10',
        showMinimized && 'size-9',
        isHellHand &&
          'bg-red-950/70 text-red-100 ring-red-200/20 hover:bg-red-700/80 hover:text-white hover:ring-red-300/60 focus:ring-red-500/35',
      )}
      onClick={() => setIsAvatarModalOpen(true)}
    >
      {selectedAvatar ? (
        <img
          src={selectedAvatar.src}
          alt=""
          className="absolute inset-0 size-full rounded-full object-cover"
        />
      ) : (
        <UserRound
          className={cn(
            'size-7 text-muted-foreground transition group-hover:text-primary-foreground',
            compact && 'size-5',
            showMinimized && 'size-5',
            isHellHand && 'text-red-100/70 group-hover:text-white',
          )}
        />
      )}
      {!showMinimized ? (
        <span
          className={cn(
            'absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground',
            compact && 'size-5',
            isHellHand &&
              'border-red-200/15 bg-black text-red-100 group-hover:border-red-300/60 group-hover:bg-red-700/80 group-hover:text-white',
          )}
        >
          <Pencil className={cn('size-3', compact && 'size-2.5')} />
        </span>
      ) : null}
    </button>
  );

  if (showMinimized) {
    return (
      <>
        <section
          className={cn(
            isHellHand
              ? 'relative rounded-lg border border-red-200/15 bg-black/70 p-2 text-stone-100 shadow-2xl shadow-black/50 backdrop-blur-md'
              : 'relative rounded-lg border border-border bg-card p-2 shadow-sm',
            className,
          )}
        >
          <div className="flex min-h-10 items-center gap-2">
            {avatarButton}

            <button
              type="button"
              className={cn(
                'min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold leading-none text-foreground outline-none transition focus-visible:underline',
                isHellHand && 'text-stone-100 hover:text-red-100',
              )}
              aria-label="Expand login"
              onClick={() => setIsMinimized(false)}
            >
              {displayNickname}
            </button>

            {canRenderGoogleLogin ? (
              <>
                <span
                  className={cn(
                    'shrink-0 text-[0.65rem] font-semibold uppercase text-muted-foreground',
                    isHellHand && 'text-red-100/60',
                  )}
                >
                  or
                </span>
                <div
                  className={cn(
                    'relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-stone-200/25 bg-white shadow-sm transition',
                    isHellHand && 'border-red-200/15 bg-stone-100 hover:border-red-300/45',
                  )}
                >
                  <img
                    src={googleIcon}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none size-5"
                    draggable="false"
                  />
                  <div
                    ref={googleButtonRef}
                    className={cn(
                      'absolute inset-0 grid size-9 place-items-center overflow-hidden opacity-0',
                      (isGoogleLoading || isGoogleSubmitting) && 'hidden',
                    )}
                  />

                  {isGoogleLoading || isGoogleSubmitting ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className={cn(
                        'size-9 rounded-full p-0',
                        isHellHand &&
                          'border-red-200/15 bg-black/45 text-red-100 hover:bg-black/45',
                      )}
                    >
                      {isGoogleSubmitting ? (
                        <i className="pi pi-spin pi-spinner text-sm" />
                      ) : (
                        <GoogleLogo />
                      )}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}

            <button
              type="button"
              className={cn(
                'grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-border bg-background/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                isHellHand &&
                  'border-red-200/15 bg-black/50 text-red-100/70 hover:bg-red-700/35 hover:text-white focus:ring-red-500/35',
              )}
              aria-label="Expand login"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        </section>

        <AvatarEditModal
          isOpen={isAvatarModalOpen}
          selectedAvatar={selectedAvatar}
          onClose={() => setIsAvatarModalOpen(false)}
          onSelect={selectAvatar}
          variant={isHellHand ? 'hellHand' : 'default'}
        />
      </>
    );
  }

  return (
    <>
      <section
        className={cn(
          isHellHand
            ? 'relative rounded-lg border border-red-200/15 bg-black/70 p-3 text-stone-100 shadow-2xl shadow-black/50 backdrop-blur-md'
            : 'relative rounded-lg border border-border bg-card p-6 shadow-sm',
          compact && !isHellHand && 'p-3',
          isGoogleAuth && (isHellHand ? 'pb-12' : 'pb-14'),
          className,
        )}
      >
        {minimizable ? (
          <button
            type="button"
            className={cn(
              'absolute right-2 top-2 grid size-7 cursor-pointer place-items-center rounded-md border border-border bg-background/70 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              isHellHand &&
                'border-red-200/15 bg-black/50 text-red-100/65 hover:bg-red-700/35 hover:text-white focus:ring-red-500/35',
            )}
            aria-label="Minimize login"
            onClick={() => setIsMinimized(true)}
          >
            <Minus className="size-4" />
          </button>
        ) : null}
        <span
          className={cn(
            'mb-4 block w-full text-center text-xs font-semibold leading-5 text-muted-foreground',
            compact && 'mb-2 text-[0.65rem] leading-4',
            minimizable && 'pr-7',
            isHellHand && 'text-red-100/70',
          )}
        >
          {t('auth.playAsGuest')}
        </span>
        <div className={cn('flex items-center gap-4', compact && 'gap-3')}>
          <div
            className={cn(
              'flex w-20 shrink-0 flex-col items-center gap-2',
              compact && 'w-14 gap-1',
            )}
          >
            {avatarButton}
            <span
              className={cn(
                'text-center text-xs font-semibold leading-4 text-muted-foreground',
                compact && 'text-[0.62rem] leading-3',
                isHellHand && 'text-red-100/65',
              )}
            >
              {t('auth.selectAvatar')}
            </span>
          </div>

          <div className={cn('min-w-0 flex-1 self-start pt-1 mt-2', compact && 'mt-1 pt-0')}>
            <div
              className={cn(
                'min-h-8 truncate text-2xl font-medium leading-none text-foreground',
                compact && 'min-h-6 text-lg',
                isHellHand && 'text-stone-100',
              )}
            >
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

        <label className={cn('mt-6 block', compact && 'mt-3')}>
          <span
            className={cn(
              'text-sm font-medium text-muted-foreground',
              compact && 'text-xs',
              isHellHand && 'text-red-100/70',
            )}
          >
            {t('auth.nick')}
          </span>
          <div className={cn('mt-2 flex gap-2', compact && 'mt-1.5 gap-1.5')}>
            <input
              type="text"
              name="nickname"
              maxLength={24}
              value={nickname}
              placeholder={t('auth.nickPlaceholder')}
              className={cn(
                'h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40',
                compact && 'h-8 px-2 text-xs',
                isHellHand &&
                  'border-red-200/15 bg-black/55 text-stone-100 placeholder:text-red-100/35 focus:border-red-300/55 focus:ring-red-600/30',
              )}
              onChange={(event) => {
                setNickname(event.target.value);
                setSaveError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSaveProfile && !isSaving) {
                  void saveGuestProfile();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('auth.saveNick')}
              disabled={!canSaveProfile || isSaving}
              className={cn(
                'h-11 w-11 shrink-0 cursor-pointer disabled:cursor-not-allowed',
                compact && 'h-8 w-8',
                isHellHand &&
                  'border-red-200/15 bg-red-950/35 text-red-100 hover:border-red-300/45 hover:bg-red-700/55 hover:text-white disabled:opacity-40',
              )}
              onClick={() => {
                void saveGuestProfile();
              }}
            >
              <i
                className={`pi ${
                  isSaving ? 'pi-spin pi-spinner' : 'pi-save'
                } ${compact ? 'text-sm' : 'text-base'}`}
              />
            </Button>
          </div>
        </label>

        {saveError ? (
          <p
            className={cn(
              'mt-3 text-sm text-destructive',
              compact && 'mt-2 text-xs',
              isHellHand && 'text-red-300',
            )}
          >
            {saveError}
          </p>
        ) : null}

        {canRenderGoogleLogin ? (
          <>
            <div className={cn('my-6 flex items-center gap-3', compact && 'my-3 gap-2')}>
              <span className={cn('h-px flex-1 bg-border', isHellHand && 'bg-red-200/15')} />
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                  compact && 'text-[0.65rem]',
                  isHellHand && 'text-red-100/60',
                )}
              >
                {t('auth.or')}
              </span>
              <span className={cn('h-px flex-1 bg-border', isHellHand && 'bg-red-200/15')} />
            </div>

            <div className="grid justify-items-center gap-2">
              <div
                ref={googleButtonRef}
                className={cn(
                  'min-h-11 w-full overflow-hidden [&>div]:mx-auto',
                  compact && 'min-h-9',
                  (isGoogleLoading || isGoogleSubmitting) && 'hidden',
                )}
              />

              {isGoogleLoading || isGoogleSubmitting ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className={cn(
                    'h-11 w-full gap-3',
                    compact && 'h-9 gap-2 text-xs',
                    isHellHand && 'border-red-200/15 bg-black/45 text-red-100 hover:bg-black/45',
                  )}
                >
                  {isGoogleSubmitting ? (
                    <i className={cn('pi pi-spin pi-spinner text-base', compact && 'text-sm')} />
                  ) : (
                    <GoogleLogo />
                  )}
                  {t('auth.loginGoogle')}
                </Button>
              ) : null}

              {hasAuthToken && !isGoogleAuth ? (
                <p
                  className={cn(
                    'text-center text-xs leading-5 text-muted-foreground',
                    compact && 'text-[0.65rem] leading-4',
                    isHellHand && 'text-red-100/55',
                  )}
                >
                  {t('auth.googleKeepsGuest')}
                </p>
              ) : null}

              {googleError ? (
                <p
                  className={cn(
                    'text-center text-sm text-destructive',
                    compact && 'text-xs',
                    isHellHand && 'text-red-300',
                  )}
                >
                  {googleError}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {isGoogleAuth ? (
          <button
            type="button"
            aria-label={t('auth.logoutGoogleAria')}
            title={t('auth.logoutGoogleAria')}
            className={cn(
              'absolute bottom-3 right-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-background/80 px-3 text-xs font-semibold text-muted-foreground shadow-sm transition hover:border-destructive/45 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring',
              compact && 'bottom-2 right-2 h-8 px-2 text-[0.68rem]',
              isHellHand &&
                'border-red-200/15 bg-black/55 text-red-100/70 hover:border-red-300/45 hover:bg-red-950/45 hover:text-red-100 focus:ring-red-500/35',
            )}
            onClick={handleGoogleLogout}
          >
            <LogOut className={cn('size-3.5', compact && 'size-3')} />
            {t('auth.logoutGoogle')}
          </button>
        ) : null}
      </section>

      <AvatarEditModal
        isOpen={isAvatarModalOpen}
        selectedAvatar={selectedAvatar}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={selectAvatar}
        variant={isHellHand ? 'hellHand' : 'default'}
      />
    </>
  );
});

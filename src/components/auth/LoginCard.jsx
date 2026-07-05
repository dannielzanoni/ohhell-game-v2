import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useId,
  useRef,
  useState,
} from 'react';
import { Pencil, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AvatarEditModal } from './AvatarEditModal.jsx';
import { findAvatar } from '@/assets/catalog/avatarCatalog.js';
import { Button } from '@/components/ui/button.jsx';
import { ResilientImage } from '@/components/ui/resilient-image.jsx';
import { TypingAnimation } from '@/components/ui/typing-animation.jsx';
import { environment } from '@/config/environment.js';
import { cn } from '@/lib/utils.js';
import { useAuthController } from './useAuthController.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Identity Services is unavailable.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    );

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
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });
}

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

function getSavedAvatar() {
  const savedAvatarId = storage.getItem(storageKeys.guestAvatar);

  return findAvatar(savedAvatarId);
}

function resolveAvatarFromPicture(picture) {
  if (!picture) {
    return null;
  }

  const avatar = findAvatar(picture);

  return avatar || { id: '', picture, src: picture };
}

function getInitialProfile(authService) {
  const profile = authService.getCurrentProfile();

  return {
    avatar: resolveAvatarFromPicture(profile.picture) || getSavedAvatar(),
    isGoogle: profile.isGoogle,
    nickname:
      profile.nickname || storage.getItem(storageKeys.guestNickname) || '',
  };
}

export const LoginCard = forwardRef(function LoginCard(
  { className, onProfileStateChange, onSaved },
  ref,
) {
  const authService = useAuthController();
  const { t } = useTranslation();
  const googleButtonRef = useRef(null);
  const saveErrorId = useId();
  const googleErrorId = useId();
  const initialProfileRef = useRef(null);

  if (!initialProfileRef.current) {
    initialProfileRef.current = getInitialProfile(authService);
  }

  const [hasAuthToken, setHasAuthToken] = useState(() =>
    Boolean(authService.getAuthToken()),
  );
  const [isGoogleAuth, setIsGoogleAuth] = useState(
    () => initialProfileRef.current.isGoogle,
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    () => initialProfileRef.current.avatar,
  );
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

  const syncProfileFromAuth = useCallback(() => {
    const profile = authService.getCurrentProfile();
    const profileAvatar = resolveAvatarFromPicture(profile.picture);
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

      storage.setItem(storageKeys.guestNickname, nextNickname);
      if (nextAvatarId) {
        storage.setItem(storageKeys.guestAvatar, nextAvatarId);
      } else {
        storage.removeItem(storageKeys.guestAvatar);
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
        const loginResponse = await authService.loginWithGoogle(
          response.credential,
        );
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

  const trimmedNickname = nickname.trim();
  const selectedAvatarId = selectedAvatar?.id || '';
  const canSaveProfile =
    !hasAuthToken ||
    trimmedNickname !== savedNickname ||
    selectedAvatarId !== savedAvatarId;
  const displayNickname = trimmedNickname || savedNickname || 'Guest';
  const shouldAnimateNickname = Boolean(savedNickname) && !canSaveProfile;
  const canRenderGoogleLogin = Boolean(environment.googleClientId) && !isGoogleAuth;
  const selectAvatar = (avatar) => {
    storage.setItem(storageKeys.guestAvatar, avatar.id);
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
  }, [
    canSaveProfile,
    hasAuthToken,
    isSaving,
    onProfileStateChange,
    saveError,
  ]);

  useEffect(() => {
    if (!canRenderGoogleLogin) {
      return undefined;
    }

    let isMounted = true;

    setIsGoogleLoading(true);
    setGoogleError('');

    loadGoogleIdentityScript()
      .then(() => {
        if (
          !isMounted ||
          !googleButtonRef.current ||
          !window.google?.accounts?.id
        ) {
          return;
        }

        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          shape: 'pill',
          size: 'large',
          text: 'continue_with',
          theme: 'outline',
          width: 260,
        });
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
  }, [canRenderGoogleLogin, handleGoogleCredential, t]);

  return (
    <>
      <section
        className={cn(
          'rounded-lg border border-border bg-card p-6 shadow-sm',
          className,
        )}
      >
        <span className="mb-4 block w-full text-center text-xs font-semibold leading-5 text-muted-foreground">
          {t('auth.playAsGuest')}
        </span>
        <div className="flex items-center gap-4">
          <div className="flex w-20 shrink-0 flex-col items-center gap-2">
            <button
              type="button"
              aria-label={t('auth.editGuestAvatar')}
              className="group relative grid size-14 shrink-0 cursor-pointer place-items-center rounded-full bg-secondary ring-2 ring-border transition hover:bg-primary hover:text-primary-foreground hover:ring-primary/60 focus:outline-none focus:ring-4 focus:ring-ring"
              onClick={() => setIsAvatarModalOpen(true)}
            >
              {selectedAvatar ? (
                <ResilientImage
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
              {t('auth.selectAvatar')}
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
          <span className="text-sm font-medium text-muted-foreground">
            {t('auth.nick')}
          </span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              name="nickname"
              maxLength={24}
              value={nickname}
              placeholder={t('auth.nickPlaceholder')}
              aria-describedby={saveError ? saveErrorId : undefined}
              aria-invalid={Boolean(saveError)}
              className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
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
              aria-describedby={saveError ? saveErrorId : undefined}
              disabled={!canSaveProfile || isSaving}
              className="h-11 w-11 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              onClick={() => {
                void saveGuestProfile();
              }}
            >
              <i
                className={`pi ${
                  isSaving ? 'pi-spin pi-spinner' : 'pi-save'
                } text-base`}
              />
            </Button>
          </div>
        </label>

        {saveError ? (
          <p id={saveErrorId} role="alert" className="mt-3 text-sm text-destructive">{saveError}</p>
        ) : null}

        {canRenderGoogleLogin ? (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('auth.or')}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid justify-items-center gap-2">
              <div
                ref={googleButtonRef}
                aria-describedby={googleError ? googleErrorId : undefined}
                className={cn(
                  'min-h-11 w-full overflow-hidden [&>div]:mx-auto',
                  (isGoogleLoading || isGoogleSubmitting) && 'hidden',
                )}
              />

              {isGoogleLoading || isGoogleSubmitting ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="h-11 w-full gap-3"
                >
                  {isGoogleSubmitting ? (
                    <i className="pi pi-spin pi-spinner text-base" />
                  ) : (
                    <GoogleLogo />
                  )}
                  {t('auth.loginGoogle')}
                </Button>
              ) : null}

              {hasAuthToken && !isGoogleAuth ? (
                <p className="text-center text-xs leading-5 text-muted-foreground">
                  {t('auth.googleKeepsGuest')}
                </p>
              ) : null}

              {googleError ? (
                <p id={googleErrorId} role="alert" className="text-center text-sm text-destructive">
                  {googleError}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </section>

      <AvatarEditModal
        isOpen={isAvatarModalOpen}
        selectedAvatar={selectedAvatar}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={selectAvatar}
      />
    </>
  );
});

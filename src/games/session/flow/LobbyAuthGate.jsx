import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoginCard } from '@/features/auth/components/LoginCard.jsx';
import { GAME_TYPES } from '@/games/core/model/gameTypes.js';
import { Button } from '@/shared/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog.jsx';
import { cn } from '@/shared/lib/utils.js';

export function LobbyAuthGate({
  canContinue,
  error,
  gameType,
  isConfirming,
  onContinue,
  onProfileSaved,
  onProfileStateChange,
  open,
  profileCardRef,
}) {
  const { t } = useTranslation();
  const isHellHand = gameType === GAME_TYPES.HELL_HAND;

  return (
    <Dialog open={open}>
      <DialogContent
        className={cn(
          'pointer-events-auto z-[70] max-w-md p-5 text-white shadow-2xl shadow-black/50',
          isHellHand
            ? 'border-red-200/15 bg-black/92 text-stone-100'
            : 'border-white/10 bg-zinc-950/95',
        )}
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={cn(isHellHand && 'text-amber-100')}>
            {t('game.enterRoom')}
          </DialogTitle>
          <DialogDescription className={cn(isHellHand && 'text-red-100/70')}>
            {t('game.confirmProfile')}
          </DialogDescription>
        </DialogHeader>

        <LoginCard
          ref={profileCardRef}
          compact={isHellHand}
          variant={isHellHand ? 'hellHand' : 'default'}
          className={cn(
            'shadow-none',
            isHellHand ? 'border-red-200/15 bg-black/45' : 'border-white/10 bg-black/30 p-5',
          )}
          onProfileStateChange={onProfileStateChange}
          onSaved={onProfileSaved}
        />

        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter
          className={cn(
            '-mx-5 -mb-5 px-5',
            isHellHand ? 'border-red-200/15 bg-red-950/20' : 'border-white/10 bg-black/30',
          )}
        >
          <Button
            type="button"
            disabled={!canContinue || isConfirming}
            className={cn(
              'h-11 w-full gap-2 sm:w-auto',
              isHellHand && 'border border-amber-200/40 bg-amber-300 text-black hover:bg-amber-200',
            )}
            onClick={onContinue}
          >
            {isConfirming ? (
              <i className="pi pi-spin pi-spinner text-sm" />
            ) : (
              <LogIn className="size-4" />
            )}
            {isConfirming ? t('game.enteringRoom') : t('game.enterRoom')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

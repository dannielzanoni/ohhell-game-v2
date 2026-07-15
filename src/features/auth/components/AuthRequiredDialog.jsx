import { useTranslation } from 'react-i18next';
import { LoginCard } from '@/features/auth/components/LoginCard.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog.jsx';

export function AuthRequiredDialog({ onAuthenticated, request }) {
  const { t } = useTranslation();
  const variant = request?.variant || 'default';
  const isHellHand = variant === 'hellHand';

  return (
    <Dialog open>
      <DialogContent
        className={
          isHellHand
            ? 'pointer-events-auto z-[80] max-w-sm border-red-200/15 bg-black/92 p-5 text-stone-100 shadow-2xl shadow-black/60'
            : 'pointer-events-auto z-[80] max-w-sm border-white/10 bg-zinc-950/95 p-5 text-white shadow-2xl shadow-black/50'
        }
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={isHellHand ? 'text-amber-100' : undefined}>
            {t('auth.requiredTitle')}
          </DialogTitle>
          <DialogDescription className={isHellHand ? 'text-red-100/70' : undefined}>
            {t('auth.requiredDescription')}
          </DialogDescription>
        </DialogHeader>
        <LoginCard
          compact={isHellHand}
          variant={variant}
          className={isHellHand ? 'shadow-none' : 'border-white/10 bg-black/30 p-5 shadow-none'}
          onSaved={onAuthenticated}
        />
      </DialogContent>
    </Dialog>
  );
}

import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button.jsx';

const repositoryUrl = 'https://github.com/dannielzanoni/ohhell-game-v2';

export function Github() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-3xl place-items-center">
        <div className="w-full rounded-lg border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('pages.github.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {t('pages.github.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t('pages.github.description')}
          </p>
          <Button asChild className="mt-6 h-11 cursor-pointer gap-2">
            <a href={repositoryUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              {t('pages.github.open')}
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}

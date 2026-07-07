import { useTranslation } from 'react-i18next';
import { ArrowLeft, Layers, Volume2 } from 'lucide-react';

export function SettingsView({ controller }) {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh overflow-y-auto bg-background px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-foreground md:min-h-screen md:px-6 md:py-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <button
          type="button"
          className="flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => controller.goBack()}
        >
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </button>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('settings.title')}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            {t('pages.settings.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            {t('pages.settings.description')}
          </p>
        </section>

        <section
          aria-label={t('settings.mobileSections')}
          className="grid gap-3 md:grid-cols-2"
        >
          <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <Volume2 className="size-5 text-primary" />
            <h2 className="mt-3 text-base font-bold">
              {t('settings.sounds')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('settings.mobileSoundsDescription')}
            </p>
          </article>

          <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <Layers className="size-5 text-primary" />
            <h2 className="mt-3 text-base font-bold">
              {t('settings.deck')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('settings.mobileDeckDescription')}
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}

import { useTranslation } from 'react-i18next';

export function SettingsView({ controller }) {
  const { t } = useTranslation();
  const volume = controller?.preferences?.volume ?? 0;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('settings.title')}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {t('pages.settings.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t('pages.settings.description')}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label
                className="text-base font-bold"
                htmlFor="settings-volume"
              >
                {t('settings.generalVolume')}
              </label>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('settings.generalVolumeDescription')}
              </p>
            </div>
            <output
              className="rounded-md border border-border px-3 py-2 text-sm font-black"
              htmlFor="settings-volume"
            >
              {volume}%
            </output>
          </div>

          <input
            id="settings-volume"
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            aria-valuetext={t('settings.volumeValue', { volume })}
            className="mt-5 h-11 w-full cursor-pointer accent-primary"
            onChange={(event) => controller.setVolume(event.target.value)}
          />
        </div>
      </section>
    </main>
  );
}

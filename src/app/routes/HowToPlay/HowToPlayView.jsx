import { useTranslation } from 'react-i18next';

export function HowToPlayView() {
  const { t } = useTranslation();
  const sections = t('pages.howToPlay.sections', { returnObjects: true });

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('pages.howToPlay.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            {t('pages.howToPlay.title')}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            {t('pages.howToPlay.description')}
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.id}
              className="min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <h2 className="text-xl font-black">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {section.description}
              </p>
              <ul className="mt-4 grid gap-2 text-sm leading-6">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

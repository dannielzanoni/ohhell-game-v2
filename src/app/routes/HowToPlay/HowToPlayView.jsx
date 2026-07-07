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

        <section
          aria-label={t('pages.howToPlay.mobileSections')}
          className="grid min-w-0 gap-4 md:hidden"
        >
          {sections.map((section, index) => (
            <details
              className="group min-w-0 rounded-lg border border-border bg-card shadow-sm"
              key={section.id}
              open={index === 0}
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 break-words px-5 py-4 text-left text-lg font-bold text-foreground marker:hidden focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words">{section.title}</span>
                <span aria-hidden="true" className="shrink-0 text-xl leading-none text-primary transition group-open:rotate-45">+</span>
              </summary>
              <div className="grid min-w-0 gap-4 border-t border-border px-5 py-5">
                <p className="text-sm leading-6 text-muted-foreground">{section.description}</p>
                <ul className="list-disc space-y-3 pl-5 text-base leading-7 text-muted-foreground">
                  {section.items.map((item) => (
                    <li className="break-words" key={item}>{item}</li>
                  ))}
                </ul>
                <aside className="min-w-0 rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-semibold text-foreground">{t('pages.howToPlay.exampleLabel')}</p>
                  <p className="mt-2 break-words">{section.example}</p>
                </aside>
              </div>
            </details>
          ))}
        </section>

        <div className="hidden gap-6 md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
          <nav
            aria-label={t('pages.howToPlay.webIndex')}
            className="hidden rounded-lg border border-border bg-card p-4 shadow-sm md:sticky md:top-6 md:block"
          >
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('pages.howToPlay.indexTitle')}
            </p>
            <ol className="mt-3 space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    className="block rounded-md px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    href={`#${section.id}`}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-6 min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm md:scroll-mt-8"
              >
                <h2 id={`${section.id}-title`} className="text-xl font-black">{section.title}</h2>
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
        </div>
      </section>
    </main>
  );
}

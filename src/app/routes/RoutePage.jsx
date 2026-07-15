import { Link } from 'react-router-dom';
import { House } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import gameTableBg from '@/assets/classic/backgrounds/game-table-bg.png';

export function RoutePage({ children, title, description, homeButtonInHeader = false, homePath = '/', tableBackground = false }) {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8">
      {tableBackground ? (
        <>
          <img src={gameTableBg} alt="" className="absolute inset-0 size-full object-cover opacity-65" draggable="false" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        </>
      ) : null}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
        {!homeButtonInHeader ? (
          <Link
            to={homePath}
            className="w-fit rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground"
          >
            {t('common.backHome')}
          </Link>
        ) : null}

        <section className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Oh Hell Game V2
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {title}
              </h1>
            </div>
            {homeButtonInHeader ? (
              <Link to={homePath} className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted">
                <House className="size-4" />
                Home
              </Link>
            ) : null}
          </div>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </section>
        {children}
      </div>
    </main>
  );
}

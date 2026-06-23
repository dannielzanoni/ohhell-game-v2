import { Link } from 'react-router-dom';

export function RoutePage({ title, description }) {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Link
          to="/"
          className="w-fit rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground"
        >
          Voltar para Home
        </Link>

        <section className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Oh Hell Game V2
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </section>
      </div>
    </main>
  );
}

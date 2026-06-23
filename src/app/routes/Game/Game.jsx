import { Home, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import gameBg from '@/assets/videos/game-bg.mp4';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button.jsx';

export function Game() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <video
          className="h-full w-full object-cover opacity-45"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={gameBg} type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-[2px]" />

      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-8">
        <div className="rounded-lg border border-border bg-card/85 p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Live table
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Oh Hell Game
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Configure a partida antes de entrar na mesa.
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card/85 p-6 shadow-lg shadow-black/10 backdrop-blur md:p-8">
          <div>
            <h2 className="text-2xl font-bold">Game Configurations</h2>
          </div>

          <div className="mt-8 grid gap-7">
            <label className="block">
              <span className="text-sm font-semibold text-foreground">
                Numero de Vidas
              </span>
              <br></br>
              <select
                name="lives"
                defaultValue="5"
                className="mt-3 h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 md:max-w-xs"
              >
                {[1, 2, 3, 4, 5].map((life) => (
                  <option key={life} value={life}>
                    {life}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/55 p-4 md:max-w-xl">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Sala publica
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recurso reservado para uma etapa futura.
                </p>
              </div>
              <button
                type="button"
                disabled
                aria-label="Ativar sala publica"
                className="relative h-7 w-12 shrink-0 cursor-not-allowed rounded-full bg-muted opacity-60"
              >
                <span className="absolute left-1 top-1 size-5 rounded-full bg-muted-foreground/70" />
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <InteractiveHoverButton
                type="button"
                className="h-12 w-full border-border text-base md:w-56"
              >
                <span className="inline-flex items-center gap-2">
                  <Play className="size-4" />
                  Play
                </span>
              </InteractiveHoverButton>

              <Link
                to="/"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:w-56"
              >
                <Home className="size-4" />
                Home
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

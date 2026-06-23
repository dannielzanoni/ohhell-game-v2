import gameBg from '@/assets/videos/game-bg.mp4';
import { Button } from '@/components/ui/button.jsx';

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

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-border bg-card/85 p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Live table
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              Oh Hell Game
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Prepare a rodada, declare seu bid e tente cravar exatamente o
              numero de vazas prometidas.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg">Criar partida</Button>
              <Button size="lg" variant="outline">
                Entrar em sala
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['Round', '03 / 10'],
              ['Players', '04'],
              ['Trump', 'Hearts'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-card/85 p-6 shadow-lg shadow-black/10 backdrop-blur"
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-lg border border-border bg-card/85 p-6 shadow-lg shadow-black/10 backdrop-blur">
            <h2 className="text-xl font-bold">Players</h2>
            <div className="mt-5 grid gap-3">
              {[
                ['Ana', 'Bid 2', 'Won 1'],
                ['Bruno', 'Bid 0', 'Won 0'],
                ['Clara', 'Bid 3', 'Won 2'],
                ['Diego', 'Bid 1', 'Won 1'],
              ].map(([name, bid, won]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-md border border-border bg-background/55 p-4"
                >
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-muted-foreground">{bid}</p>
                  </div>
                  <span className="rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                    {won}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card/85 p-6 shadow-lg shadow-black/10 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Table Preview</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Espaco reservado para mao, mesa, placar e controles da vez.
                </p>
              </div>
              <Button variant="secondary">Finalizar turno</Button>
            </div>

            <div className="mt-8 grid min-h-64 place-items-center rounded-lg border border-dashed border-border bg-background/55 p-6">
              <div className="grid grid-cols-5 gap-3">
                {['A', 'K', 'Q', 'J', '10'].map((card) => (
                  <div
                    key={card}
                    className="grid h-32 w-20 place-items-center rounded-md border border-border bg-card text-3xl font-black shadow-md"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

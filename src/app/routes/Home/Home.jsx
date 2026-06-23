import { Link } from 'react-router-dom';
import gameBg from '@/assets/videos/game-bg.mp4';
import { LoginCard } from '@/components/auth/LoginCard.jsx';
import { VideoText } from '@/components/ui/video-text.jsx';
import { pageLinks } from '../pageLinks.js';

export function Home() {
  return (
    <main className="min-h-screen overflow-hidden px-6 py-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-8 shadow-sm md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_30%)]" />
          <div className="relative">
            <div className="relative mt-4 hidden h-44 w-full overflow-hidden md:block">
              <VideoText
                src={gameBg}
                fontSize={13}
                fontWeight="900"
                className="drop-shadow-2xl"
              >
                Oh Hell Game
              </VideoText>
            </div>
            <div className="relative mt-4 grid gap-1 md:hidden">
              <div className="h-24 overflow-hidden">
                <VideoText
                  src={gameBg}
                  fontSize={24}
                  fontWeight="900"
                  className="drop-shadow-2xl"
                >
                  Oh Hell
                </VideoText>
              </div>
              <div className="h-24 overflow-hidden">
                <VideoText
                  src={gameBg}
                  fontSize={32}
                  fontWeight="900"
                  className="drop-shadow-2xl"
                >
                  Game
                </VideoText>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Escolha uma area para entrar na partida, criar salas, estudar as
              regras ou acompanhar a lideranca.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
          <LoginCard />

          <nav className="grid gap-4 md:grid-cols-2">
            {pageLinks.map((page) => {
              const Icon = page.icon;

              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className="group rounded-lg border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {page.label}
                    </span>
                  </span>
                  <span className="mt-4 block text-sm leading-6 text-muted-foreground">
                    {page.description}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>
    </main>
  );
}

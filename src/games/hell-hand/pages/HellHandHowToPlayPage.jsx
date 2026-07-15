import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import hellHandBg from '@/games/hell-hand/assets/backgrounds/hell-hand-bg.avif';

export function HellHandHowToPlay() {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-6 text-stone-100 sm:px-6">
      <img src={hellHandBg} alt="" className="absolute inset-0 size-full object-cover" draggable="false" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(0,0,0,0.94),rgba(35,8,8,0.76)_52%,rgba(0,0,0,0.95))]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4 rounded-lg border border-red-200/12 bg-black/70 p-5 shadow-2xl shadow-black/35 backdrop-blur md:p-7">
          <div>
            <p className="text-xs font-black uppercase text-amber-300/75">Hell Hand</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              {t('pages.hellHandHome.actions.howToPlay')}
            </h1>
          </div>
          <Link to="/hell-hand" className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-red-200/20 bg-black/60 px-3 text-sm font-bold text-stone-100 transition hover:border-amber-300/50 hover:bg-red-950/60 hover:text-amber-100">
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </header>

        <section className="min-h-[28rem] rounded-lg border border-red-200/12 bg-black/65 shadow-2xl shadow-black/35 backdrop-blur" aria-label={t('pages.hellHandHome.actions.howToPlay')} />
      </div>
    </main>
  );
}

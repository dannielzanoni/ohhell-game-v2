import card1Ouro from '@/assets/cards/spanish/1ouro.jpg';
import card2Espada from '@/assets/cards/spanish/2espada.jpg';
import card3Paus from '@/assets/cards/spanish/3paus.jpg';
import frenchCard1Ouro from '@/assets/cards/french/1ouro.png';
import frenchCard2Espada from '@/assets/cards/french/2espada.png';
import frenchCard3Paus from '@/assets/cards/french/3paus.png';
import { LoginCard } from '@/components/auth/LoginCard.jsx';
import { HomeShortcuts } from './HomeShortcuts.jsx';
import { MobileHero } from './MobileHero.jsx';
import { WebHero } from './WebHero.jsx';

const cardGroups = [
  {
    title: 'Spanish',
    cards: [
      { src: card1Ouro, label: '1 de ouro espanhol' },
      { src: card2Espada, label: '2 de espada espanhol' },
      { src: card3Paus, label: '3 de paus espanhol' },
    ],
  },
  {
    title: 'French',
    cards: [
      { src: frenchCard1Ouro, label: '1 de ouro frances' },
      { src: frenchCard2Espada, label: '2 de espada frances' },
      { src: frenchCard3Paus, label: '3 de paus frances' },
    ],
  },
];

export function HomeView() {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-6 md:px-6 lg:h-screen lg:px-6 lg:py-5">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:h-full lg:max-w-7xl lg:gap-5">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm md:p-8 lg:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_30%)]" />
          <div className="relative">
            <WebHero />
            <MobileHero />

            <section className="mt-4 rounded-lg border border-border bg-background/55 p-4 shadow-lg shadow-black/10 backdrop-blur lg:mt-4 lg:p-3">
              <div className="grid gap-4 md:grid-cols-2 lg:gap-3">
                {cardGroups.map((group) => (
                  <div
                    key={group.title}
                    className="overflow-hidden px-4 pt-1"
                  >
                    <div className="flex h-[8.5rem] items-start justify-center px-2 pt-2 md:h-34 lg:h-28 xl:h-32">
                      {group.cards.map((card, index) => (
                        <img
                          key={card.label}
                          src={card.src}
                          alt={card.label}
                          className="relative mt-1 h-[12.65rem] w-[8.05rem] shrink-0 rounded-[8%] border border-black bg-card object-cover shadow-xl transition duration-200 hover:z-20 hover:-translate-y-5 hover:rotate-0 hover:scale-105 hover:shadow-2xl lg:h-[10.35rem] lg:w-[6.9rem] xl:h-[11.5rem] xl:w-[7.5rem]"
                          style={{
                            marginLeft: index === 0 ? 0 : '-2.75rem',
                            rotate: `${(index - 1) * 4.4}deg`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-5">
          <LoginCard className="lg:p-5" />

          <HomeShortcuts />
        </div>
      </section>
    </main>
  );
}

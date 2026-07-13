import { useTranslation } from 'react-i18next';
import card4Paus from '@/assets/cards/spanish_8bit/4paus.png';
import card5Paus from '@/assets/cards/spanish_8bit/5paus.png';
import card6Paus from '@/assets/cards/spanish_8bit/6paus.png';
import card7Paus from '@/assets/cards/spanish_8bit/7paus.png';
import card10Paus from '@/assets/cards/spanish_8bit/10paus.png';
import card11Paus from '@/assets/cards/spanish_8bit/11paus.png';
import card12Paus from '@/assets/cards/spanish_8bit/12paus.png';
import card1Paus from '@/assets/cards/spanish_8bit/1paus.png';
import card2Paus from '@/assets/cards/spanish_8bit/2paus.png';
import card3Paus from '@/assets/cards/spanish_8bit/3paus.png';
import card1Ouro from '@/assets/cards/spanish_8bit/1ouro.png';
import card1Espada from '@/assets/cards/spanish_8bit/1espada.png';
import card1Copas from '@/assets/cards/spanish_8bit/1copas.png';
import { RoutePage } from '../RoutePage.jsx';

const rankCards = [
  ['4', card4Paus],
  ['5', card5Paus],
  ['6', card6Paus],
  ['7', card7Paus],
  ['10', card10Paus],
  ['11', card11Paus],
  ['12', card12Paus],
  ['1', card1Paus],
  ['2', card2Paus],
  ['3', card3Paus],
];

const suitCards = [
  ['golds', card1Ouro],
  ['swords', card1Espada],
  ['cups', card1Copas],
  ['clubs', card1Paus],
];

function CardSequence({ cards, suitLabels = false, t }) {
  return (
    <div className="mt-4 overflow-x-auto pb-3">
      <div className="flex min-w-max items-end gap-3">
        {cards.map(([labelKey, image]) => {
          const label = suitLabels
            ? t(`pages.howToPlay.rules.suits.${labelKey}`)
            : labelKey;
          return (
          <figure key={labelKey} className="w-24 shrink-0 text-center">
            <img
              src={image}
              alt={t('pages.howToPlay.rules.cardAlt', { label })}
              className="aspect-[2/3] w-full rounded border border-black/30 object-cover shadow-lg shadow-black/25"
              draggable="false"
            />
            <figcaption className="mt-2 text-xs font-bold uppercase text-muted-foreground">
              {label}
            </figcaption>
          </figure>
          );
        })}
      </div>
    </div>
  );
}

export function HowToPlay() {
  const { t } = useTranslation();

  return (
    <RoutePage
      title={t('pages.howToPlay.title')}
      description={t('pages.howToPlay.description')}
      homeButtonInHeader
      homePath="/home"
      tableBackground
    >
      <article className="rounded-lg border border-border bg-card/92 p-5 shadow-xl shadow-black/20 backdrop-blur md:p-8">
        <div className="grid gap-5 text-base leading-7 text-foreground/90">
          {[1, 2, 3, 4].map((item) => <p key={item}>{t(`pages.howToPlay.rules.intro${item}`)}</p>)}
        </div>

        <section className="mt-8 border-t border-border pt-7">
          <h2 className="text-2xl font-black">{t('pages.howToPlay.rules.cardsTitle')}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{t('pages.howToPlay.rules.cardsText')}</p>
        </section>

        <section className="mt-8 border-t border-border pt-7">
          <h2 className="text-2xl font-black">{t('pages.howToPlay.rules.jokerTitle')}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{t('pages.howToPlay.rules.jokerText')}</p>
        </section>

        <section className="mt-8 border-t border-border pt-7">
          <h2 className="text-2xl font-black">{t('pages.howToPlay.rules.bidsTitle')}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{t('pages.howToPlay.rules.bidsText')}</p>
        </section>

        <section className="mt-8 border-t border-border pt-7">
          <h2 className="text-2xl font-black">{t('pages.howToPlay.rules.strengthTitle')}</h2>
          <h3 className="mt-5 text-sm font-black uppercase text-primary">{t('pages.howToPlay.rules.rankOrder')}</h3>
          <CardSequence cards={rankCards} t={t} />
          <h3 className="mt-6 text-sm font-black uppercase text-primary">{t('pages.howToPlay.rules.suitOrder')}</h3>
          <CardSequence cards={suitCards} suitLabels t={t} />
        </section>
      </article>
    </RoutePage>
  );
}

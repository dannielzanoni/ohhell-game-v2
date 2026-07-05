// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import '@/i18n/index.js';
import { TableCenter } from './GameView.jsx';

afterEach(cleanup);

describe('TableCenter', () => {
  it('identifies the selected deck and preserves accessible pile origin', () => {
    const pile = [
      { player_id: 'ada', card: { rank: 'Three', suit: 'Clubs' } },
      { player_id: 'grace', card: { rank: 'Four', suit: 'Golds' } },
    ];
    const { container } = render(
      <TableCenter
        cardBackSrc="back.png"
        deckType="spanish_8bit"
        elevatedPileCardKey="grace:Four:Golds"
        pile={pile}
        playersById={{ ada: { nickname: 'Ada' }, grace: { nickname: 'Grace' } }}
        upcard={{ rank: 'Four', suit: 'Cups' }}
      />,
    );

    expect(screen.getByLabelText('Spanish 8-bit deck and joker card')).toBeInTheDocument();
    const playedCards = [
      screen.getByAltText('Ada played 3 of clubs'),
      screen.getByAltText('Grace played 4 of golds'),
    ];
    expect(playedCards[0].compareDocumentPosition(playedCards[1])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(playedCards[1]).toHaveClass('pointer-events-none', 'ring-4');
    expect(container.querySelectorAll('img[title]').length).toBe(2);
  });
});

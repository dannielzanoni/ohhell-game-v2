// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { PlayerHand } from './GameView.jsx';

afterEach(cleanup);

const card = { rank: 'Three', suit: 'Clubs' };

describe('PlayerHand web interaction', () => {
  it('exposes an accessible native button with visible keyboard focus styles', () => {
    render(<PlayerHand canPlayCards cardBackSrc="back.png" cards={[card]} deckType="spanish" onPlayCard={() => {}} />);

    const button = screen.getByRole('button', { name: 'Play 3 of clubs' });
    expect(button).toBeEnabled();
    expect(button).toHaveClass('sm:hover:-translate-y-6', 'focus-visible:ring-4');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('does not send twice when the card is clicked rapidly', () => {
    const onPlayCard = vi.fn();
    render(<PlayerHand canPlayCards cardBackSrc="back.png" cards={[card]} deckType="spanish" onPlayCard={onPlayCard} />);
    const button = screen.getByRole('button', { name: 'Play 3 of clubs' });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });
});

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

    const button = screen.getByRole('button', { name: 'Select 3 of clubs' });
    expect(button).toBeEnabled();
    expect(button).toHaveClass('sm:hover:-translate-y-6', 'focus-visible:ring-4');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('does not send twice when the card is clicked rapidly', () => {
    const onPlayCard = vi.fn();
    render(<PlayerHand canPlayCards cardBackSrc="back.png" cards={[card]} deckType="spanish" onPlayCard={onPlayCard} />);
    const cardButton = screen.getByRole('button', { name: 'Select 3 of clubs' });
    fireEvent.click(cardButton);
    const button = screen.getByRole('button', { name: 'Play 3 of clubs' });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });

  it('selects visibly and never plays from a horizontal scroll gesture', () => {
    const onPlayCard = vi.fn();
    render(<PlayerHand canPlayCards cardBackSrc="back.png" cards={[card]} deckType="spanish" onPlayCard={onPlayCard} />);
    const scroller = screen.getByTestId('player-hand-scroll');
    const cardButton = screen.getByRole('button', { name: 'Select 3 of clubs' });

    expect(scroller).toHaveClass('touch-pan-x', 'overscroll-x-contain', 'snap-x');
    expect(screen.getByRole('button', { name: 'Select a card' })).toBeDisabled();
    fireEvent.scroll(scroller, { target: { scrollLeft: 80 } });
    expect(onPlayCard).not.toHaveBeenCalled();

    fireEvent.click(cardButton);
    expect(cardButton).toHaveAttribute('aria-pressed', 'true');
    expect(cardButton).toHaveClass('ring-4');
    expect(screen.getByRole('button', { name: 'Play 3 of clubs' })).toBeEnabled();
  });

  it('keeps the selected card visible but disables commands while awaiting confirmation', () => {
    const { rerender } = render(<PlayerHand canPlayCards cardBackSrc="back.png" cards={[card]} deckType="spanish" onPlayCard={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select 3 of clubs' }));

    rerender(<PlayerHand canPlayCards cardBackSrc="back.png" cards={[card]} deckType="spanish" isPending onPlayCard={() => {}} />);

    expect(screen.getByRole('button', { name: 'Select 3 of clubs' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Card sent. Waiting for the server…' })).toBeDisabled();
  });
});

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { createGameEndSummary, GameEndedOverlay } from './GameView.jsx';

describe('winner result', () => {
  it('keeps every tied winner at the maximum positive life count', () => {
    const summary = createGameEndSummary(
      { ada: 2, grace: 2, linus: 0 },
      { ada: { id: 'ada', nickname: 'Ada' }, grace: { id: 'grace', nickname: 'Grace' } },
      5,
    );
    expect(summary.noWinners).toBe(false);
    expect(summary.winners.map(({ id }) => id)).toEqual(['ada', 'grace']);
  });

  it('renders accessible avatar fallbacks and delegates resource-safe navigation', () => {
    const onBackToMenu = vi.fn();
    const summary = createGameEndSummary(
      { ada: 1, grace: 1 },
      { ada: { id: 'ada', nickname: 'Ada' }, grace: { id: 'grace', nickname: 'Grace' } },
      5,
    );
    render(<GameEndedOverlay onBackToMenu={onBackToMenu} summary={summary} />);

    expect(screen.getByLabelText('Ada avatar')).toBeInTheDocument();
    expect(screen.getByLabelText('Grace avatar')).toBeInTheDocument();
    expect(screen.getByText('The remaining players tied.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Menu' }));
    expect(onBackToMenu).toHaveBeenCalledOnce();
  });

  it('renders an explicit result when every player has zero lives', () => {
    const summary = createGameEndSummary(
      { ada: 0, grace: 0 },
      { ada: { id: 'ada', nickname: 'Ada' }, grace: { id: 'grace', nickname: 'Grace' } },
      5,
    );
    const { container } = render(<GameEndedOverlay onBackToMenu={() => {}} summary={summary} />);

    expect(container.querySelector('[data-result="no-winner"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No winners' })).toBeInTheDocument();
    expect(screen.getByText('Everyone ran out of lives.')).toBeInTheDocument();
    expect(screen.queryByText('Winner')).not.toBeInTheDocument();
  });
});

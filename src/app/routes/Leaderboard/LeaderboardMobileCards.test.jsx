// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { LeaderboardView } from './LeaderboardView.jsx';

afterEach(cleanup);

describe('LeaderboardView mobile cards', () => {
  it('prioritizes position, player and primary performance, with secondary metrics expandable per player', () => {
    render(
      <LeaderboardView
        controller={{
          error: null,
          isLoading: false,
          leaderboard: [
            {
              average_bid: 2.5,
              bid_accuracy: 88.8,
              games_played: 10,
              matches_won: 6,
              player_id: 'grace-id',
              player: {
                type: 'Anonymous',
                data: { id: 'grace-id', data: { nickname: 'Grace' } },
              },
              rounds_won: 14,
              win_rate: 60,
            },
          ],
          refresh: vi.fn(),
        }}
      />,
    );

    const cards = screen.getByTestId('leaderboard-mobile-cards');
    expect(cards).toHaveClass('md:hidden');
    expect(cards).not.toHaveClass('overflow-x-auto');
    expect(within(cards).getByText('Grace')).toBeInTheDocument();
    expect(cards).toHaveTextContent('6 wins - 60.0%');

    const details = within(cards).getByText('Secondary metrics').closest('details');
    expect(details).not.toHaveAttribute('open');
    expect(details).toHaveTextContent('Games 10');
    expect(details).toHaveTextContent('Rounds 14');
    expect(details).toHaveTextContent('Bid 88.8%');
    expect(details).toHaveTextContent('Avg bid 2.50');
  });
});

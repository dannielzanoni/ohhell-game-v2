// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { LeaderboardView } from './LeaderboardView.jsx';

afterEach(cleanup);

describe('LeaderboardView web table', () => {
  it('shows all ranking metrics in an accessible horizontally scrollable table', () => {
    render(
      <LeaderboardView
        controller={{
          error: null,
          isLoading: false,
          leaderboard: [
            {
              average_bid: 2.5,
              bid_accuracy: 88.8,
              favorite_card: { rank: 'Four', suit: 'Golds' },
              games_played: 10,
              matches_won: 6,
              player_id: 'grace-id',
              player: {
                type: 'Anonymous',
                data: { id: 'grace-id', data: { nickname: 'Grace' } },
              },
              rounds_won: 14,
              trump_cards: 7,
              win_rate: 60,
            },
          ],
          refresh: vi.fn(),
        }}
      />,
    );

    const scrollRegion = screen.getByRole('region', {
      name: 'Leaderboard table with horizontal scrolling',
    });
    expect(scrollRegion).toHaveClass('overflow-x-auto');
    expect(scrollRegion).toHaveAttribute('tabindex', '0');

    expect(screen.getByRole('table')).toHaveClass('min-w-[62rem]');
    expect(screen.getByText(/Leaderboard with position, player, games/i)).toHaveClass('sr-only');
    for (const header of [
      '#',
      'Player',
      'Games',
      'Wins',
      'Win rate',
      'Rounds',
      'Bid hit',
      'Avg bid',
      'Trumps',
      'Favorite',
    ]) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }

    expect(screen.getAllByText('Grace')).toHaveLength(2);
    expect(screen.getAllByText('10')).toHaveLength(2);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
    expect(screen.getAllByText('14')).toHaveLength(2);
    expect(screen.getAllByText('88.8%')).toHaveLength(2);
    expect(screen.getAllByText('2.50')).toHaveLength(2);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4 of golds')).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { LeaderboardView } from './LeaderboardView.jsx';

afterEach(cleanup);

const globalController = {
  error: null,
  isLoading: false,
  leaderboard: [],
  refresh: vi.fn(),
};

describe('Leaderboard my stats feature section', () => {
  it('does not render authenticated stats when the feature flag controller is disabled', () => {
    render(
      <LeaderboardView
        controller={globalController}
        myStatsController={{ enabled: false }}
      />,
    );

    expect(screen.queryByText('My statistics')).not.toBeInTheDocument();
  });

  it('renders the same leaderboard page with a flagged my-stats section', () => {
    render(
      <LeaderboardView
        controller={globalController}
        myStatsController={{
          enabled: true,
          error: null,
          isLoading: false,
          refresh: vi.fn(),
          stats: {
            favorite_card: { rank: 'One', suit: 'Cups' },
            games_played: 3,
            matches_won: 2,
            win_rate: 66.6,
          },
          status: 'ready',
        }}
      />,
    );

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('My statistics')).toBeInTheDocument();
    expect(screen.getByText('ace of cups')).toBeInTheDocument();
  });
});

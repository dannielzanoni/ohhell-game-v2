// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import '@/i18n/index.js';
import { LeaderboardView } from './LeaderboardView.jsx';

afterEach(async () => {
  cleanup();
  await i18next.changeLanguage('en');
});

const leaderboard = [
  {
    average_bid: 1234.5,
    bid_accuracy: 88.8,
    favorite_card: { rank: 'One', suit: 'Cups' },
    games_played: 1234,
    matches_won: 6,
    player_id: 'ada',
    player: { type: 'Anonymous', data: { id: 'ada', data: { nickname: 'Ada' } } },
    rounds_won: 14,
    trump_cards: 7,
    win_rate: 60,
  },
];

function renderLeaderboard() {
  render(
    <LeaderboardView
      controller={{
        error: null,
        isLoading: false,
        leaderboard,
        refresh: vi.fn(),
      }}
    />,
  );
}

describe('Leaderboard localized formatting', () => {
  it('formats numbers, percentages and card names in English', () => {
    renderLeaderboard();

    expect(screen.getAllByText('1,234')).toHaveLength(2);
    expect(screen.getAllByText('88.8%')).toHaveLength(2);
    expect(screen.getAllByText('1,234.50')).toHaveLength(2);
    expect(screen.getByText('ace of cups')).toBeInTheDocument();
  });

  it('formats numbers, percentages and card names in Portuguese', async () => {
    await i18next.changeLanguage('pt');
    renderLeaderboard();

    expect(screen.getAllByText('1.234')).toHaveLength(2);
    expect(screen.getAllByText('88,8%')).toHaveLength(2);
    expect(screen.getAllByText('1.234,50')).toHaveLength(2);
    expect(screen.getByText('ás de copas')).toBeInTheDocument();
  });
});

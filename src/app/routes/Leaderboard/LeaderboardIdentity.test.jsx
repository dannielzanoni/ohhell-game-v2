// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import '@/i18n/index.js';
import { resolveAvatarSrc } from '@/assets/catalog/avatarCatalog.js';
import { LeaderboardView } from './LeaderboardView.jsx';

afterEach(async () => {
  cleanup();
  await i18next.changeLanguage('en');
});

function renderLeaderboard() {
  render(
    <LeaderboardView
      controller={{
        error: null,
        isLoading: false,
        leaderboard: [
          {
            average_bid: 2.5,
            bid_accuracy: 88.8,
            favorite_card: { rank: 'One', suit: 'Cups' },
            games_played: 10,
            matches_won: 6,
            player_id: 'guest-ada',
            player: {
              type: 'Anonymous',
              data: {
                id: 'guest-ada',
                data: { nickname: 'Ada', picture: '../profile_pictures/1.png' },
              },
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
}

describe('Leaderboard identity and favorite card', () => {
  it('resolves avatars through the shared catalog and labels favorite cards in English', () => {
    renderLeaderboard();

    const avatars = screen.getAllByAltText('Ada avatar');
    expect(avatars[0]).toHaveAttribute('src', resolveAvatarSrc('../profile_pictures/1.png'));
    expect(screen.getAllByText('ace of cups')).toHaveLength(2);
  });

  it('uses localized rank and suit labels instead of hard-coded Portuguese', async () => {
    await i18next.changeLanguage('pt');
    renderLeaderboard();

    expect(screen.getAllByAltText('Avatar de Ada')).toHaveLength(2);
    expect(screen.getAllByText('ás de copas')).toHaveLength(2);
  });
});

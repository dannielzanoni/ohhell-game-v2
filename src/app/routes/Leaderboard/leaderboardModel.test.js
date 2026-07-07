import { describe, expect, it } from 'vitest';
import '@/i18n/index.js';
import i18next from 'i18next';
import { createLeaderboardRows } from './leaderboardModel.js';

describe('createLeaderboardRows', () => {
  it('centralizes player, metric and favorite-card formatting for table and cards', () => {
    const rows = createLeaderboardRows([
      {
        average_bid: 2.345,
        bid_accuracy: 75,
        favorite_card: { rank: 'Three', suit: 'Clubs' },
        games_played: 12,
        matches_won: 4,
        player_id: 'ada-id',
        player: { type: 'Google', data: { name: 'Ada Lovelace', picture: '1' } },
        rounds_won: 9,
        trump_cards: 3,
        win_rate: 33.333,
      },
    ], i18next.t);

    expect(rows).toEqual([
      expect.objectContaining({
        averageBid: '2.35',
        bidAccuracy: '75.0%',
        favoriteCard: '3 of clubs',
        gamesPlayed: '12',
        id: 'ada-id',
        matchesWon: '4',
        playerName: 'Ada Lovelace',
        position: 1,
        roundsWon: '9',
        trumpCards: '3',
        winRate: '33.3%',
      }),
    ]);
  });
});

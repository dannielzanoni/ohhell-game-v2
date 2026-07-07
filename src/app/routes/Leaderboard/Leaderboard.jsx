import { environment } from '@/config/environment.js';
import { LeaderboardView } from './LeaderboardView.jsx';
import { useMyStatsController } from './useMyStatsController.js';
import { useLeaderboardController } from './useLeaderboardController.js';

export function Leaderboard() {
  const controller = useLeaderboardController();
  const myStatsController = useMyStatsController({
    enabled: environment.enableMyStats,
  });

  return (
    <LeaderboardView
      controller={controller}
      myStatsController={myStatsController}
    />
  );
}

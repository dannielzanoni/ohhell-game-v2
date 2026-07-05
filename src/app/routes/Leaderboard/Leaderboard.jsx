import { LeaderboardView } from './LeaderboardView.jsx';
import { useLeaderboardController } from './useLeaderboardController.js';

export function Leaderboard() {
  const controller = useLeaderboardController();

  return <LeaderboardView controller={controller} />;
}

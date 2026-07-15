import { apiRequest } from '@/shared/api/apiClient.js';
import { withAuthRetry } from '@/features/auth/api/authService.js';

export function getLeaderboard({ limit } = {}) {
  return apiRequest('/stats', {
    query: { limit },
  });
}

export function getMyStats() {
  return withAuthRetry(() =>
    apiRequest('/stats/me', {
      auth: true,
    }),
  );
}

export const statsService = {
  getLeaderboard,
  getMyStats,
};

import { apiRequest } from './apiClient.js';
import { withAuthRetry } from './authService.js';

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

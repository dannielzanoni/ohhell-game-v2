import { apiRequest } from './apiClient.js';

export function getLeaderboard({ limit } = {}) {
  return apiRequest('/stats', {
    query: { limit },
  });
}

export function getMyStats() {
  return apiRequest('/stats/me', {
    auth: true,
  });
}

export const statsService = {
  getLeaderboard,
  getMyStats,
};

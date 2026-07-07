import { apiRequest } from './apiClient.js';

export function getLeaderboard({ limit, signal } = {}) {
  return apiRequest('/stats', {
    query: { limit },
    signal,
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

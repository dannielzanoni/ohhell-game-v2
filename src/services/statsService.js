import { apiRequest } from './apiClient.js';

export function getLeaderboard({ limit } = {}) {
  return apiRequest('/stats', {
    query: { limit },
  });
}

export function getMyStats({ signal } = {}) {
  return apiRequest('/stats/me', {
    auth: true,
    signal,
  });
}

export const statsService = {
  getLeaderboard,
  getMyStats,
};

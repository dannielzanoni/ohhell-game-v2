import { useMemo } from 'react';
import { authService } from '@/services/authService.js';

export function useAuthController() {
  return useMemo(() => authService, []);
}

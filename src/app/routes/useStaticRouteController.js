import { useMemo } from 'react';
import { usePlatform } from '@/platform/PlatformProvider.jsx';

export function useStaticRouteController() {
  const platform = usePlatform();

  return useMemo(() => ({ platform }), [platform]);
}

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider, usePlatform } from './PlatformProvider.jsx';

function Consumer() {
  const platform = usePlatform();
  return (
    <output>
      {platform.platform}:{platform.mobileUiVersion}:{String(platform.isMobileV2)}
    </output>
  );
}

function createBrowser(search = '?ui=mobile&mobile_ui=v1', width = 390) {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const mediaQuery = { addEventListener, removeEventListener };
  return {
    addEventListener,
    document,
    innerWidth: width,
    location: { search },
    matchMedia: () => mediaQuery,
    removeEventListener,
  };
}

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-platform');
  document.documentElement.removeAttribute('data-mobile-ui');
});

describe('PlatformProvider rollout flags', () => {
  it('exposes query-forced mobile v1 without writing browser storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <PlatformProvider browser={createBrowser()}>
        <Consumer />
      </PlatformProvider>,
    );

    expect(screen.getByText('mobile:v1:false')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-platform', 'mobile');
    expect(document.documentElement).toHaveAttribute('data-mobile-ui', 'v1');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('uses the environment default when QA query is absent', () => {
    render(
      <PlatformProvider
        browser={createBrowser('?ui=mobile', 390)}
        environment={{ VITE_MOBILE_UI_VERSION: 'v2' }}
      >
        <Consumer />
      </PlatformProvider>,
    );

    expect(screen.getByText('mobile:v2:true')).toBeInTheDocument();
  });
});

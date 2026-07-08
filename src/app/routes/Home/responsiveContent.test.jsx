// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { MobileHero } from './MobileHero.jsx';
import { WebHero } from './WebHero.jsx';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('responsive home content', () => {
  it('uses a single semantic app name key and leaves line breaks to the view', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileHero />
        <WebHero />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Oh Hell Game')).toHaveLength(4);
    expect(screen.queryByText('Oh Hell')).not.toBeInTheDocument();
    expect(screen.queryByText('Game', { exact: true })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-text-wrap="normal"]')).toHaveLength(2);
  });
});

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { CreateGameView } from './CreateGameView.jsx';

function controller() {
  return {
    createGame: vi.fn(),
    error: null,
    isCreating: false,
    lives: '5',
    setLives: vi.fn(),
  };
}

function renderCreateGame() {
  return render(
    <MemoryRouter>
      <CreateGameView controller={controller()} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CreateGameView media optimization', () => {
  it('uses a lightweight poster image when optional media should not load', () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } });

    const { container } = renderCreateGame();

    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="game-table-bg"]')).toHaveAttribute('decoding', 'async');
  });

  it('keeps the background video metadata-only when optional media is allowed', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    })));

    const { container } = renderCreateGame();
    const video = container.querySelector('video');

    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('poster');
    expect(video).toHaveAttribute('preload', 'metadata');
  });
});

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileHero } from './MobileHero.jsx';
import '@/i18n/index.js';

let reducedMotion = false;
let saveData = false;

beforeEach(() => {
  reducedMotion = false;
  saveData = false;
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: reducedMotion,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  Object.defineProperty(window.navigator, 'connection', {
    configurable: true,
    value: {
      get saveData() { return saveData; },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderHero() {
  return render(<MemoryRouter><MobileHero /></MemoryRouter>);
}

describe('MobileHero', () => {
  it('keeps the title and primary actions in one compact hero', () => {
    const { container } = renderHero();
    expect(screen.getByRole('heading', { name: 'Oh Hell Game' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Play' })).toHaveAttribute('href', '/create-game');
    expect(screen.getByRole('link', { name: 'Rooms' })).toHaveAttribute('href', '/rooms');
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  it.each([
    ['reduced motion', () => { reducedMotion = true; }],
    ['data saver', () => { saveData = true; }],
  ])('does not expose the heavy video source with %s', (_label, enablePreference) => {
    enablePreference();
    const { container } = renderHero();
    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('[data-media-mode="poster"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Oh Hell Game' })).toBeInTheDocument();
  });
});

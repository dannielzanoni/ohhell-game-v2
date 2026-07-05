// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebHero } from './WebHero.jsx';
import '@/i18n/index.js';

afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

describe('WebHero', () => {
  it('offers first-viewport actions and an accessible title', () => {
    render(<MemoryRouter><WebHero /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Oh Hell Game' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Play' })).toHaveAttribute('href', '/create-game');
    expect(screen.getByRole('link', { name: 'Rooms' })).toHaveAttribute('href', '/rooms');
  });

  it('uses a poster, disables autoplay for reduced motion and survives media failure', () => {
    const { container } = render(<MemoryRouter><WebHero /></MemoryRouter>);
    const video = container.querySelector('video');
    expect(video).toHaveAttribute('poster');
    expect(video.autoplay).toBe(false);
    fireEvent.error(video);
    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Oh Hell Game' })).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateGameView } from './CreateGameView.jsx';
import '@/i18n/index.js';

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

function BrowserBack() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Browser back</button>;
}

function renderCreate(controller) {
  return render(
    <MemoryRouter initialEntries={['/', '/create-game']} initialIndex={1}>
      <BrowserBack />
      <Routes>
        <Route path="/" element={<h1>Home destination</h1>} />
        <Route path="/create-game" element={<CreateGameView controller={controller} />} />
      </Routes>
    </MemoryRouter>,
  );
}

function controller() {
  return {
    createGame: vi.fn(),
    error: null,
    isCreating: false,
    lives: '5',
    setLives: vi.fn(),
  };
}

describe('CreateGame cancellation', () => {
  it('uses the canonical Home destination without creating a lobby', () => {
    const state = controller();
    renderCreate(state);
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(screen.getByRole('heading', { name: 'Home destination' })).toBeInTheDocument();
    expect(state.createGame).not.toHaveBeenCalled();
  });

  it('browser back reaches the same Home destination without creating a lobby', () => {
    const state = controller();
    renderCreate(state);
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(screen.getByRole('heading', { name: 'Home destination' })).toBeInTheDocument();
    expect(state.createGame).not.toHaveBeenCalled();
  });
});

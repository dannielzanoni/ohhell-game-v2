// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomsView } from './RoomsView.jsx';
import '@/i18n/index.js';

afterEach(cleanup);

describe('RoomsView desktop listing', () => {
  it('shows id, players/capacity, state and join action in a bounded grid', () => {
    render(
      <MemoryRouter>
        <RoomsView controller={{
          error: null,
          isLoading: false,
          lobbies: [{ id: 'a-very-long-room-id-that-must-truncate', players: 2, capacity: 13, state: 'Waiting' }],
          refresh: vi.fn(),
        }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('a-very-long-room-id-that-must-truncate')).toHaveClass('truncate');
    expect(screen.getByText('2/13')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
    expect(screen.getByTestId('rooms-list')).toHaveClass('min-w-0', 'overflow-hidden');
  });
});

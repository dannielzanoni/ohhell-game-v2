// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomsView } from './RoomsView.jsx';
import '@/i18n/index.js';

afterEach(cleanup);

describe('RoomsView desktop listing', () => {
  it('offers the same create route in the header and empty state', () => {
    render(
      <MemoryRouter>
        <RoomsView controller={{
          copyRoomId: vi.fn(),
          error: null,
          isLoading: false,
          lobbies: [],
          refresh: vi.fn(),
          status: 'empty',
        }} />
      </MemoryRouter>,
    );
    const createLinks = screen.getAllByRole('link', { name: 'Create' });
    expect(createLinks).toHaveLength(2);
    for (const link of createLinks) expect(link).toHaveAttribute('href', '/create-game');
  });

  it('shows id, players/capacity, state and join action in a bounded grid', () => {
    const copyRoomId = vi.fn();
    render(
      <MemoryRouter>
        <RoomsView controller={{
          error: null,
          copyRoomId,
          isLoading: false,
          lobbies: [{ id: 'a-very-long-room-id-that-must-truncate', players: 2, capacity: 13, state: 'Waiting' }],
          refresh: vi.fn(),
        }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('a-very-long-room-id-that-must-truncate')).toHaveClass('truncate');
    expect(screen.getByText('a-very-long-room-id-that-must-truncate')).toHaveAttribute('title', 'a-very-long-room-id-that-must-truncate');
    expect(screen.getByText('2/13')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
    const copy = screen.getByRole('button', { name: 'Copy room ID a-very-long-room-id-that-must-truncate' });
    copy.click();
    expect(copyRoomId).toHaveBeenCalledWith('a-very-long-room-id-that-must-truncate');
    expect(screen.getByRole('article', { name: 'Room a-very-long-room-id-that-must-truncate' })).toBeInTheDocument();
    expect(screen.getByTestId('rooms-list')).toHaveClass('min-w-0', 'overflow-hidden');
  });
});

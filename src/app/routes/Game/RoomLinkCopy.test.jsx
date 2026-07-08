// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomLinkCopy } from './GameView.jsx';
import '@/i18n/index.js';

afterEach(cleanup);

describe('RoomLinkCopy', () => {
  it('copies the canonical link and announces temporary success', async () => {
    const copyText = vi.fn().mockResolvedValue();
    render(
      <RoomLinkCopy
        copyText={copyText}
        getRoomInviteLink={() => 'https://play.test/game/room-1'}
        lobbyId="room-1"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy room link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Room link copied.');
    expect(copyText).toHaveBeenCalledWith('https://play.test/game/room-1');
  });
});

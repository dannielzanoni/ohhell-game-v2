import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/config/environment.js', () => ({
  environment: { chatHubUrl: '/chatHub' },
}));

import {
  joinClassicChatLobby,
  leaveClassicChatLobby,
  sendClassicChatMessage,
} from './chatHub.js';

describe('classic chat hub adapter', () => {
  it('uses the lobby-aware SignalR contract', async () => {
    const connection = { invoke: vi.fn(() => Promise.resolve()) };

    await joinClassicChatLobby(connection, 'lobby-42');
    await sendClassicChatMessage(connection, 'lobby-42', 'Alice', 'Hello!');
    await leaveClassicChatLobby(connection, 'lobby-42');

    expect(connection.invoke).toHaveBeenNthCalledWith(1, 'JoinLobby', 'lobby-42');
    expect(connection.invoke).toHaveBeenNthCalledWith(
      2,
      'SendMessage',
      'lobby-42',
      'Alice',
      'Hello!',
    );
    expect(connection.invoke).toHaveBeenNthCalledWith(3, 'LeaveLobby', 'lobby-42');
  });
});

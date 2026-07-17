import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClassicChat } from './useClassicChat.js';

const chatMocks = vi.hoisted(() => {
  const handlers = new Map();
  const lifecycleHandlers = {};
  const state = { connected: false };
  const connection = {
    off: vi.fn(),
    on: vi.fn((event, handler) => handlers.set(event, handler)),
    onclose: vi.fn((handler) => {
      lifecycleHandlers.close = handler;
    }),
    onreconnected: vi.fn((handler) => {
      lifecycleHandlers.reconnected = handler;
    }),
    onreconnecting: vi.fn((handler) => {
      lifecycleHandlers.reconnecting = handler;
    }),
    start: vi.fn(() => {
      state.connected = true;
      return Promise.resolve();
    }),
    stop: vi.fn(() => {
      state.connected = false;
      return Promise.resolve();
    }),
  };

  return {
    connection,
    handlers,
    join: vi.fn(() => Promise.resolve()),
    leave: vi.fn(() => Promise.resolve()),
    lifecycleHandlers,
    send: vi.fn(() => Promise.resolve()),
    state,
  };
});

vi.mock('@/games/classic/api/chatHub.js', () => ({
  CHAT_RECEIVE_EVENT: 'ReceiveMessage',
  createClassicChatConnection: () => chatMocks.connection,
  isClassicChatConnected: () => chatMocks.state.connected,
  joinClassicChatLobby: chatMocks.join,
  leaveClassicChatLobby: chatMocks.leave,
  sendClassicChatMessage: chatMocks.send,
}));

describe('useClassicChat', () => {
  beforeEach(() => {
    chatMocks.handlers.clear();
    Object.keys(chatMocks.lifecycleHandlers).forEach((key) => {
      delete chatMocks.lifecycleHandlers[key];
    });
    chatMocks.state.connected = false;
    vi.clearAllMocks();
  });

  it('registers ReceiveMessage and stores messages from the hub', async () => {
    const { result, unmount } = renderHook(() =>
      useClassicChat({ enabled: true, lobbyId: 'lobby-42', user: 'Alice' }),
    );

    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(chatMocks.join).toHaveBeenCalledWith(chatMocks.connection, 'lobby-42');

    act(() => {
      chatMocks.handlers.get('ReceiveMessage')('Bob', 'Boa rodada!');
    });

    expect(result.current.messages[0]).toMatchObject({
      message: 'Boa rodada!',
      user: 'Bob',
    });
    unmount();
    await waitFor(() => {
      expect(chatMocks.leave).toHaveBeenCalledWith(chatMocks.connection, 'lobby-42');
      expect(chatMocks.connection.stop).toHaveBeenCalled();
    });
  });

  it('invokes SendMessage with the current nickname', async () => {
    const { result, unmount } = renderHook(() =>
      useClassicChat({ enabled: true, lobbyId: 'lobby-42', user: 'Alice' }),
    );
    await waitFor(() => expect(result.current.status).toBe('connected'));

    await act(() => result.current.sendMessage('  Hello!  '));

    expect(chatMocks.send).toHaveBeenCalledWith(
      chatMocks.connection,
      'lobby-42',
      'Alice',
      'Hello!',
    );
    unmount();
  });

  it('rejects messages longer than the configured limit', async () => {
    const { result, unmount } = renderHook(() =>
      useClassicChat({ enabled: true, lobbyId: 'lobby-42', user: 'Alice' }),
    );
    await waitFor(() => expect(result.current.status).toBe('connected'));

    await expect(result.current.sendMessage('a'.repeat(161))).rejects.toThrow(
      'CHAT_MESSAGE_TOO_LONG',
    );
    expect(chatMocks.send).not.toHaveBeenCalled();
    unmount();
  });

  it('joins the lobby again after SignalR reconnects', async () => {
    const { result, unmount } = renderHook(() =>
      useClassicChat({ enabled: true, lobbyId: 'lobby-42', user: 'Alice' }),
    );
    await waitFor(() => expect(result.current.status).toBe('connected'));

    await act(async () => {
      await chatMocks.lifecycleHandlers.reconnected();
    });

    expect(chatMocks.join).toHaveBeenCalledTimes(2);
    expect(chatMocks.join).toHaveBeenLastCalledWith(chatMocks.connection, 'lobby-42');
    expect(result.current.status).toBe('connected');
    unmount();
  });

  it('does not connect without a lobby id', async () => {
    const { result } = renderHook(() => useClassicChat({ enabled: true, user: 'Alice' }));

    await waitFor(() => expect(result.current.status).toBe('disabled'));
    expect(chatMocks.connection.start).not.toHaveBeenCalled();
    await expect(result.current.sendMessage('Hello')).rejects.toThrow('CHAT_LOBBY_REQUIRED');
  });
});

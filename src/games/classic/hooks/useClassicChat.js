import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHAT_RECEIVE_EVENT,
  createClassicChatConnection,
  isClassicChatConnected,
  joinClassicChatLobby,
  leaveClassicChatLobby,
  sendClassicChatMessage,
} from '@/games/classic/api/chatHub.js';
import { CLASSIC_CHAT_MESSAGE_MAX_LENGTH } from '@/games/classic/config/classicSessionConfig.js';

const MAX_CHAT_MESSAGES = 100;
const INITIAL_RETRY_DELAY_MS = 5000;

export function useClassicChat({ enabled = true, lobbyId, user }) {
  const connectionRef = useRef(null);
  const messageSequenceRef = useRef(0);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(enabled ? 'connecting' : 'disabled');

  useEffect(() => {
    const normalizedLobbyId = String(lobbyId || '').trim();
    setMessages([]);
    messageSequenceRef.current = 0;

    if (!enabled || !normalizedLobbyId) {
      setStatus('disabled');
      return undefined;
    }

    const connection = createClassicChatConnection();
    let disposed = false;
    let retryTimeout = null;
    connectionRef.current = connection;

    const handleMessage = (sender, message) => {
      if (disposed) return;
      messageSequenceRef.current += 1;
      const receivedAt = new Date();
      const nextMessage = {
        id: `${receivedAt.getTime()}-${messageSequenceRef.current}`,
        message: String(message || ''),
        receivedAt,
        user: String(sender || 'Guest'),
      };

      setMessages((currentMessages) => {
        return [...currentMessages, nextMessage].slice(-MAX_CHAT_MESSAGES);
      });
    };

    const scheduleRetry = () => {
      if (disposed || retryTimeout) return;
      retryTimeout = window.setTimeout(() => {
        retryTimeout = null;
        void connectAndJoinLobby();
      }, INITIAL_RETRY_DELAY_MS);
    };

    const connectAndJoinLobby = async (pendingStatus = 'connecting') => {
      if (disposed) return;
      setStatus(pendingStatus);

      try {
        if (!isClassicChatConnected(connection)) {
          await connection.start();
        }
        await joinClassicChatLobby(connection, normalizedLobbyId);
        if (!disposed) {
          if (retryTimeout) window.clearTimeout(retryTimeout);
          retryTimeout = null;
          setStatus('connected');
        }
      } catch {
        if (disposed) return;
        setStatus('offline');
        scheduleRetry();
      }
    };

    connection.on(CHAT_RECEIVE_EVENT, handleMessage);
    connection.onreconnecting(() => {
      if (disposed) return;
      if (retryTimeout) window.clearTimeout(retryTimeout);
      retryTimeout = null;
      setStatus('reconnecting');
    });
    connection.onreconnected(async () => {
      await connectAndJoinLobby('reconnecting');
    });
    connection.onclose(() => {
      if (disposed) return;
      setStatus('offline');
      scheduleRetry();
    });

    void connectAndJoinLobby();

    return () => {
      disposed = true;
      if (retryTimeout) window.clearTimeout(retryTimeout);
      connection.off(CHAT_RECEIVE_EVENT, handleMessage);
      connectionRef.current = null;
      const leaveLobbyAndStop = async () => {
        try {
          if (isClassicChatConnected(connection)) {
            await leaveClassicChatLobby(connection, normalizedLobbyId);
          }
        } catch {
          // SignalR removes disconnected clients from groups; stopping must still continue.
        } finally {
          await connection.stop();
        }
      };
      void leaveLobbyAndStop();
    };
  }, [enabled, lobbyId]);

  const sendMessage = useCallback(
    async (message) => {
      const normalizedMessage = String(message || '').trim();
      const normalizedLobbyId = String(lobbyId || '').trim();
      const normalizedUser = String(user || '').trim() || 'Guest';
      const connection = connectionRef.current;

      if (!normalizedMessage) return;
      if (!normalizedLobbyId) {
        throw new Error('CHAT_LOBBY_REQUIRED');
      }
      if (Array.from(normalizedMessage).length > CLASSIC_CHAT_MESSAGE_MAX_LENGTH) {
        throw new Error('CHAT_MESSAGE_TOO_LONG');
      }
      if (!isClassicChatConnected(connection)) {
        throw new Error('CHAT_OFFLINE');
      }

      await sendClassicChatMessage(
        connection,
        normalizedLobbyId,
        normalizedUser,
        normalizedMessage,
      );
    },
    [lobbyId, user],
  );

  return {
    messages,
    sendMessage,
    status,
  };
}

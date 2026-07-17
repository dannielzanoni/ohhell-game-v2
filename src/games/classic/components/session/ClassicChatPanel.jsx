import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  ChatContainer,
  InputToolbox,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { useTranslation } from 'react-i18next';
import { CLASSIC_CHAT_MESSAGE_MAX_LENGTH } from '@/games/classic/config/classicSessionConfig.js';
import { useClassicChat } from '@/games/classic/hooks/useClassicChat.js';
import './ClassicChatPanel.css';

function normalizeNickname(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase();
}

function getStatusClass(status) {
  if (status === 'connected') return 'bg-emerald-400';
  if (status === 'connecting' || status === 'reconnecting') return 'bg-amber-300';
  return 'bg-red-400';
}

function limitMessageLength(value) {
  return Array.from(String(value || ''))
    .slice(0, CLASSIC_CHAT_MESSAGE_MAX_LENGTH)
    .join('');
}

function escapeMessageInputValue(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function ClassicChatPanel({
  currentPlayer,
  enabled = true,
  lobbyId,
  onMessagesChange,
  players = [],
}) {
  const { t } = useTranslation();
  const [messageDraft, setMessageDraft] = useState('');
  const [messageLength, setMessageLength] = useState(0);
  const [, forceMessageInputUpdate] = useState(0);
  const [sendError, setSendError] = useState('');
  const currentNickname = currentPlayer?.nickname || 'Guest';
  const { messages, sendMessage, status } = useClassicChat({
    enabled,
    lobbyId,
    user: currentNickname,
  });
  const playersByNickname = useMemo(() => {
    return players.reduce((result, player) => {
      const nickname = normalizeNickname(player?.nickname);
      if (nickname && !result.has(nickname)) result.set(nickname, player);
      return result;
    }, new Map());
  }, [players]);
  const isConnected = status === 'connected';

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const handleSend = async (message) => {
    setSendError('');
    try {
      await sendMessage(message);
      setMessageDraft('');
      setMessageLength(0);
    } catch {
      setSendError(t('game.chat.sendError'));
    }
  };

  const handleMessageChange = (_, textContent) => {
    const limitedMessage = limitMessageLength(textContent);
    setMessageDraft(escapeMessageInputValue(limitedMessage));
    setMessageLength(Array.from(limitedMessage).length);
    if (Array.from(textContent).length > CLASSIC_CHAT_MESSAGE_MAX_LENGTH) {
      forceMessageInputUpdate((currentValue) => currentValue + 1);
    }
  };

  return (
    <div className="classic-chat flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-1.5 text-[0.68rem] font-bold text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${getStatusClass(status)}`} />
          {t(`game.chat.status.${status}`)}
        </span>
        <span className="truncate text-zinc-500">{currentNickname}</span>
      </div>

      <div className="relative min-h-0 flex-1">
        <MainContainer responsive>
          <ChatContainer>
            <MessageList loading={status === 'connecting'}>
              {messages.map((chatMessage) => {
                const sender = playersByNickname.get(normalizeNickname(chatMessage.user));
                const isOutgoing =
                  normalizeNickname(chatMessage.user) === normalizeNickname(currentNickname);

                return (
                  <Message
                    avatarPosition={isOutgoing ? 'tr' : 'tl'}
                    key={chatMessage.id}
                    model={{
                      direction: isOutgoing ? 'outgoing' : 'incoming',
                      message: chatMessage.message,
                      position: 'single',
                      sender: chatMessage.user,
                      sentTime: chatMessage.receivedAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    }}
                  >
                    <Avatar name={chatMessage.user} src={sender?.avatarSrc} />
                    <Message.Header
                      sender={chatMessage.user}
                      sentTime={chatMessage.receivedAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />
                  </Message>
                );
              })}
            </MessageList>
            <MessageInput
              attachButton={false}
              disabled={!isConnected}
              placeholder={t('game.chat.placeholder')}
              sendDisabled={!isConnected || messageLength === 0}
              value={messageDraft}
              onChange={handleMessageChange}
              onSend={(_, textContent) => void handleSend(textContent)}
            />
            <InputToolbox className="classic-chat__character-counter">
              <span
                aria-label={t('game.chat.characterLimit', {
                  max: CLASSIC_CHAT_MESSAGE_MAX_LENGTH,
                })}
                className="classic-chat__character-count"
              >
                {messageLength}/{CLASSIC_CHAT_MESSAGE_MAX_LENGTH}
              </span>
            </InputToolbox>
          </ChatContainer>
        </MainContainer>
      </div>

      {sendError ? (
        <p className="border-t border-red-400/20 bg-red-950/50 px-3 py-1.5 text-[0.68rem] font-semibold text-red-200">
          {sendError}
        </p>
      ) : null}
    </div>
  );
}

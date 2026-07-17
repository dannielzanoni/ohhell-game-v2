import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClassicChatPanel } from './ClassicChatPanel.jsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('@/games/classic/hooks/useClassicChat.js', () => ({
  useClassicChat: () => ({
    messages: [
      {
        id: 'message-1',
        message: 'Boa rodada!',
        receivedAt: new Date('2026-07-16T12:30:00'),
        user: 'Artemis',
      },
    ],
    sendMessage: vi.fn(),
    status: 'connected',
  }),
}));

describe('ClassicChatPanel', () => {
  it('shows the sender above the message and preserves the sender avatar', () => {
    const { container } = render(
      <ClassicChatPanel
        currentPlayer={{ nickname: 'Daniel' }}
        players={[
          {
            avatarSrc: '/src/shared/assets/profile-pictures/16.png',
            nickname: 'Artemis',
          },
        ]}
      />,
    );

    const message = container.querySelector('.cs-message');
    const header = message.querySelector('.cs-message__header');
    const content = message.querySelector('.cs-message__content');

    expect(screen.getByText('Artemis')).toBeInTheDocument();
    expect(header.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(message.querySelector('.cs-avatar img')).toHaveAttribute(
      'src',
      '/src/shared/assets/profile-pictures/16.png',
    );
  });

  it('limits the message composer to 160 characters', () => {
    const { container } = render(
      <ClassicChatPanel
        currentPlayer={{ nickname: 'Daniel' }}
        players={[{ avatarSrc: '/avatar.png', nickname: 'Artemis' }]}
      />,
    );
    const editor = container.querySelector('.cs-message-input__content-editor');

    editor.innerHTML = 'a'.repeat(161);
    fireEvent.input(editor);

    expect(editor).toHaveTextContent('a'.repeat(160));
    expect(screen.getByText('160/160')).toBeInTheDocument();
  });
});

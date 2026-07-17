import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassicTableInfo } from './ClassicTableInfo.jsx';

const tableInfoMocks = vi.hoisted(() => ({ messageSequence: 0 }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, variables = {}) => {
      const translations = {
        'game.matchPanel.chatTab': 'Chat',
        'game.matchPanel.logTab': 'Match Log',
        'game.matchPanel.title': 'Match Chat/Log',
        'game.matchPanel.unreadChat': `${variables.count} unread chat messages`,
        'game.matchPanel.unreadLog': `${variables.count} unread match log updates`,
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('./ClassicChatPanel.jsx', () => ({
  ClassicChatPanel: ({ onMessagesChange }) => (
    <div data-testid="classic-chat">
      Chat
      <button
        data-testid="receive-chat-message"
        type="button"
        onClick={() => {
          tableInfoMocks.messageSequence += 1;
          onMessagesChange([
            {
              id: `message-${tableInfoMocks.messageSequence}`,
              user: 'Other player',
            },
          ]);
        }}
      >
        Receive message
      </button>
    </div>
  ),
}));

describe('ClassicTableInfo match panel', () => {
  beforeEach(() => {
    tableInfoMocks.messageSequence = 0;
  });

  it('starts minimized and exposes Chat and Match Log tabs when opened', () => {
    render(<ClassicTableInfo bidSum={0} logs={[]} open={false} onToggle={() => {}} tableBid={0} />);

    const panelButton = screen.getByRole('button', { name: 'Match Chat/Log' });
    expect(panelButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(panelButton);

    expect(panelButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Match Log' })).toBeInTheDocument();
    expect(screen.getByTestId('classic-chat')).toBeInTheDocument();
  });

  it('shows unread counters on the inactive Chat and Match Log tabs', () => {
    const { rerender } = render(
      <ClassicTableInfo bidSum={0} logs={[]} open={false} onToggle={() => {}} tableBid={0} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Match Chat/Log' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Match Log' }));
    fireEvent.click(screen.getByTestId('receive-chat-message'));

    expect(screen.getByLabelText('1 unread chat messages')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('tab', { name: /Chat/ }));
    rerender(
      <ClassicTableInfo
        bidSum={0}
        logs={[{ id: 'log-1', type: 'setStarted' }]}
        open={false}
        onToggle={() => {}}
        tableBid={0}
      />,
    );

    expect(screen.getByLabelText('1 unread match log updates')).toHaveTextContent('1');
  });

  it('shows only Match Chat notifications while minimized', () => {
    const { rerender } = render(
      <ClassicTableInfo bidSum={0} logs={[]} open={false} onToggle={() => {}} tableBid={0} />,
    );

    rerender(
      <ClassicTableInfo
        bidSum={0}
        logs={[{ id: 'log-1', type: 'setStarted' }]}
        open={false}
        onToggle={() => {}}
        tableBid={0}
      />,
    );
    fireEvent.click(screen.getByTestId('receive-chat-message'));

    const panelButton = screen.getByRole('button', { name: /Match Chat\/Log/ });
    expect(within(panelButton).getByLabelText('1 unread chat messages')).toHaveTextContent('1');
    expect(within(panelButton).queryByLabelText('1 unread match log updates')).not.toBeInTheDocument();
  });

  it('clears notifications when the session changes lobby', () => {
    const { rerender } = render(
      <ClassicTableInfo
        bidSum={0}
        lobbyId="lobby-a"
        logs={[]}
        open={false}
        onToggle={() => {}}
        tableBid={0}
      />,
    );
    fireEvent.click(screen.getByTestId('receive-chat-message'));
    expect(screen.getAllByLabelText('1 unread chat messages')).not.toHaveLength(0);

    rerender(
      <ClassicTableInfo
        bidSum={0}
        lobbyId="lobby-b"
        logs={[]}
        open={false}
        onToggle={() => {}}
        tableBid={0}
      />,
    );

    expect(screen.queryAllByLabelText('1 unread chat messages')).toHaveLength(0);
  });
});

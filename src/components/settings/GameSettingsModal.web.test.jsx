// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { GameSettingsModal } from './GameSettingsModal.jsx';

afterEach(cleanup);

describe('GameSettingsModal web panel', () => {
  it('uses accessible tab labels, focus targets and robust desktop height bounds', () => {
    render(
      <GameSettingsModal
        open
        onOpenChange={vi.fn()}
        presentation="web"
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveClass('max-h-[min(42rem,calc(100dvh-2rem))]');
    expect(dialog).not.toHaveClass('h-[54dvh]');
    expect(dialog).not.toHaveClass('sm:max-h-[46vh]');

    const tablist = screen.getByRole('tablist', { name: 'Settings sections' });
    expect(tablist).toBeInTheDocument();

    const soundsTab = screen.getByRole('tab', { name: 'Sounds' });
    const deckTab = screen.getByRole('tab', { name: 'Type of deck' });
    const languageTab = screen.getByRole('tab', { name: 'Language' });
    expect(soundsTab).toHaveAttribute('aria-controls', 'settings-panel-sounds');
    expect(soundsTab).toHaveAttribute('tabindex', '0');
    expect(deckTab).toHaveAttribute('aria-controls', 'settings-panel-deck');
    expect(languageTab).toHaveAttribute('aria-controls', 'settings-panel-language');
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'settings-tab-sounds',
    );

    fireEvent.click(deckTab);

    const deckSections = screen.getByRole('tablist', { name: 'Deck sections' });
    expect(deckSections).toBeInTheDocument();
    expect(within(deckSections).getByRole('tab', { name: 'Type of deck' })).toHaveAttribute(
      'aria-controls',
      'settings-deck-panel-deckType',
    );
    expect(within(deckSections).getByRole('tab', { name: 'Card back' })).toHaveAttribute(
      'aria-controls',
      'settings-deck-panel-cardBack',
    );
    expect(document.getElementById('settings-deck-panel-deckType')).toHaveAttribute(
      'id',
      'settings-deck-panel-deckType',
    );

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});

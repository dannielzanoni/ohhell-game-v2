// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import '@/i18n/index.js';
import { en } from '@/i18n/locales/en.js';
import { HowToPlayView } from './HowToPlayView.jsx';

afterEach(cleanup);

describe('HowToPlayView mobile navigation', () => {
  it('uses native collapsible sections with readable examples', () => {
    render(<HowToPlayView />);

    const guide = screen.getByRole('region', { name: 'Guide sections' });
    const details = guide.querySelectorAll('details');
    expect(details).toHaveLength(en.pages.howToPlay.sections.length);
    expect(details[0]).toHaveAttribute('open');

    for (const section of en.pages.howToPlay.sections) {
      const summary = within(guide).getByText(section.title).closest('summary');
      expect(summary).toHaveClass('min-h-11', 'break-words');
      expect(screen.getByText(section.example)).toHaveClass('break-words');
    }
  });

  it('toggles without writing browser URL state', () => {
    render(<HowToPlayView />);
    const guide = screen.getByRole('region', { name: 'Guide sections' });
    fireEvent.click(within(guide).getByText('Cards and order').closest('summary'));
    expect(within(guide).getByText('Cards and order').closest('details')).toHaveAttribute('open');
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('');
  });
});

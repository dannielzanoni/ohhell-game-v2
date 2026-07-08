// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import '@/i18n/index.js';
import { en } from '@/i18n/locales/en.js';
import { HowToPlayView } from './HowToPlayView.jsx';

afterEach(cleanup);

describe('HowToPlayView web navigation', () => {
  it('renders a desktop guide index with anchors for each section', () => {
    render(<HowToPlayView />);

    const guideIndex = screen.getByRole('navigation', { name: 'Guide index' });
    expect(guideIndex).toHaveClass('md:block', 'hidden');

    for (const section of en.pages.howToPlay.sections) {
      const link = within(guideIndex).getByRole('link', { name: section.title });
      expect(link).toHaveAttribute('href', `#${section.id}`);
      expect(screen.getByRole('article', { name: section.title })).toHaveAttribute('id', section.id);
    }
  });
});

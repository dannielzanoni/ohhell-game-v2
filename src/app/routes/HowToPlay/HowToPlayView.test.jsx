// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18next from 'i18next';
import '@/i18n/index.js';
import { HowToPlayView } from './HowToPlayView.jsx';

afterEach(async () => {
  cleanup();
  await i18next.changeLanguage('en');
});

describe('HowToPlayView essential rules', () => {
  it('covers objective, card order, trump, bid, points and lives in semantic sections', () => {
    render(<HowToPlayView />);

    expect(screen.getByRole('heading', { level: 1, name: 'How To Play' })).toBeInTheDocument();
    for (const name of [
      'Goal',
      'Cards and order',
      'Trump and joker card',
      'Bid',
      'Points and lives',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getAllByText(/server confirms the play/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/valid bid options come from the server/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/updated lives/i).length).toBeGreaterThan(0);
  });

  it('renders the reviewed Portuguese content from the same structure', async () => {
    await i18next.changeLanguage('pt');
    render(<HowToPlayView />);

    expect(screen.getByRole('heading', { level: 1, name: 'Como jogar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Objetivo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Pontos e vidas' })).toBeInTheDocument();
    expect(screen.getAllByText(/opções válidas de bid vêm do servidor/i).length).toBeGreaterThan(0);
  });
});

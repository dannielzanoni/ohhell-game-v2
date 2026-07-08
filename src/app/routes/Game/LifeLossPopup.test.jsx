// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@/i18n/index.js';
import { LifeLossPopup } from './GameView.jsx';

describe('LifeLossPopup', () => {
  it('uses the event player and fully translated copy without a hardcoded name', () => {
    render(<LifeLossPopup highlight={{ lost: 2, player: { id: 'ada', nickname: 'Ada' } }} />);
    expect(screen.getByText('Life lost')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Lost 2 lives')).toBeInTheDocument();
    expect(screen.queryByText(/João/i)).not.toBeInTheDocument();
  });
});

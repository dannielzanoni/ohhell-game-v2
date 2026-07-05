// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MobileTableHud } from './GameView.jsx';
import '@/i18n/index.js';

afterEach(cleanup);

describe('MobileTableHud', () => {
  it('prioritizes the local player and keeps opponents in a compact rail across rerenders', () => {
    const local = { id: 'local', nickname: 'Ada', bid: 2, points: 1, lifes: 4, ready: true };
    const opponents = [{ id: 'remote', nickname: 'Grace', bid: 1, lifes: 5 }];
    const { container, rerender } = render(<MobileTableHud currentPlayer={local} opponents={opponents} turnPlayerId="local" />);
    expect(container.querySelector('[data-priority="local-player"]')).toHaveTextContent('Ada · You');
    expect(screen.getByLabelText('Opponents')).toHaveClass('overflow-x-auto');
    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(screen.getByText('Your turn')).toBeInTheDocument();
    rerender(<MobileTableHud currentPlayer={local} opponents={opponents} turnPlayerId="remote" />);
    expect(container.querySelector('[data-priority="local-player"]')).toHaveTextContent('Ada');
  });
});

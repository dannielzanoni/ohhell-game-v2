// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LivesSelector } from './LivesSelector.jsx';
import '@/i18n/index.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  });
});

function Harness() {
  const [lives, setLives] = useState('5');
  return <LivesSelector lives={lives} onChange={setLives} />;
}

describe('LivesSelector', () => {
  it('offers a 44px mobile stepper and respects its bounds', () => {
    render(<Harness />);
    const increase = screen.getByRole('button', { name: 'Increase lives' });
    const decrease = screen.getByRole('button', { name: 'Decrease lives' });
    expect(increase).toBeDisabled();
    expect(increase).toHaveClass('size-11');
    fireEvent.click(decrease);
    expect(screen.getByText('4', { selector: 'output' })).toBeInTheDocument();
    expect(increase).toBeEnabled();
  });
});

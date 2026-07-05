// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avatarGroups, AvatarEditModal } from './AvatarEditModal.jsx';
import '@/i18n/index.js';

let reducedMotion = false;
let saveData = false;

beforeEach(() => {
  reducedMotion = false;
  saveData = false;
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    get matches() { return reducedMotion; },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  Object.defineProperty(window.navigator, 'connection', {
    configurable: true,
    value: {
      get saveData() { return saveData; },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

function MobileHarness() {
  const [open, setOpen] = useState(true);
  return (
    <AvatarEditModal
      isOpen={open}
      selectedAvatar={avatarGroups[0].avatars[0]}
      onClose={() => setOpen(false)}
      onSelect={vi.fn()}
    />
  );
}

describe('AvatarEditModal mobile sheet', () => {
  it('uses a safe-area sheet with its own scroll and leaves no scroll lock after selection', () => {
    const { container } = render(<MobileHarness />);
    expect(screen.getByRole('dialog')).toHaveClass('rounded-t-2xl', 'pb-[env(safe-area-inset-bottom)]');
    expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Select avatar PNG 1' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it.each([
    ['reduced motion', () => { reducedMotion = true; }],
    ['data saver', () => { saveData = true; }],
  ])('does not create GIF image requests with %s', (_label, enablePreference) => {
    enablePreference();
    const { container } = render(<MobileHarness />);
    expect(screen.getByRole('status')).toHaveTextContent('Animated avatars are paused');
    expect(container.querySelector('img[src*=".gif"]')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select avatar GIF 1' })).toBeEnabled();
  });
});

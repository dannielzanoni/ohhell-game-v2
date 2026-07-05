// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { avatarGroups, AvatarEditModal } from './AvatarEditModal.jsx';
import '@/i18n/index.js';

afterEach(cleanup);

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open avatars</button>
      <AvatarEditModal
        isOpen={open}
        selectedAvatar={avatarGroups[0].avatars[0]}
        onClose={() => setOpen(false)}
        onSelect={vi.fn()}
      />
    </>
  );
}

describe('AvatarEditModal web dialog', () => {
  it('traps focus, closes with Escape and restores the trigger', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open avatars' });
    trigger.focus();
    fireEvent.click(trigger);

    const close = screen.getByRole('button', { name: 'Close modal' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    const avatarButtons = screen.getAllByRole('button', { name: /Select avatar/ });
    expect(avatarButtons.at(-1)).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('groups media, exposes selection and defers image loading', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open avatars' }));

    expect(screen.getByRole('heading', { name: 'Avatars' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Animated avatars' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select avatar PNG 1' })).toHaveAttribute('aria-pressed', 'true');
    for (const image of container.querySelectorAll('img')) {
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('decoding', 'async');
    }
  });
});

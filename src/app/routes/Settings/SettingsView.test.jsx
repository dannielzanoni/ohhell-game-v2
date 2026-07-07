// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { SettingsView } from './SettingsView.jsx';

afterEach(cleanup);

describe('SettingsView volume control', () => {
  it('renders an accessible 0 to 100 range control for keyboard and touch input', () => {
    const setVolume = vi.fn();
    render(
      <SettingsView
        controller={{
          preferences: { volume: 35 },
          setVolume,
        }}
      />,
    );

    const slider = screen.getByRole('slider', { name: 'General volume' });
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('step', '1');
    expect(slider).toHaveAttribute('aria-valuetext', 'Volume 35%');
    expect(slider).toHaveClass('h-11');
    expect(screen.getByText('35%')).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '64' } });
    expect(setVolume).toHaveBeenCalledWith('64');
  });
});

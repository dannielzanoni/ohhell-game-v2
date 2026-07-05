// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProvider } from '@/app/provider.jsx';
import { MobileNavigation } from './MobileNavigation.jsx';

afterEach(cleanup);

function renderNavigation() {
  return render(
    <MemoryRouter>
      <AppProvider><MobileNavigation /></AppProvider>
    </MemoryRouter>,
  );
}

describe('MobileNavigation', () => {
  it('renders a compact header and four primary bottom destinations', () => {
    renderNavigation();
    expect(screen.getByRole('banner')).toHaveClass('pt-[env(safe-area-inset-top)]');
    const navigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(navigation).toHaveClass('pb-[env(safe-area-inset-bottom)]');
    expect(navigation.querySelectorAll('a')).toHaveLength(4);
    navigation.querySelectorAll('a').forEach((target) => {
      expect(target).toHaveClass('min-h-14', 'min-w-11');
    });
  });

  it('opens secondary destinations in a touch-safe drawer', () => {
    renderNavigation();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const drawer = screen.getByRole('dialog', { name: 'More options' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveClass('pb-[env(safe-area-inset-bottom)]');
    expect(drawer.querySelector('a[href="/how-to-play"]')).toBeInTheDocument();
    expect(drawer.querySelector('a[href^="https://github.com"]')).not.toHaveAttribute('target');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveClass('min-h-11');
    expect(screen.getByRole('button', { name: /Language/ })).toHaveClass('min-h-11');
  });
});

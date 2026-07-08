// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProvider } from '@/app/provider.jsx';
import { DesktopSidebar } from './NavBar.jsx';

afterEach(cleanup);

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <AppProvider>
        <DesktopSidebar
          isCollapsed={false}
          onToggle={vi.fn()}
          {...props}
        />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('DesktopSidebar', () => {
  it('exposes every required destination and utility', () => {
    renderSidebar();
    const navigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    });

    expect(navigation.querySelector('a[href="/"]')).toBeInTheDocument();
    expect(navigation.querySelector('a[href="/create-game"]')).toBeInTheDocument();
    expect(navigation.querySelector('a[href="/rooms"]')).toBeInTheDocument();
    expect(navigation.querySelector('a[href="/leaderboard"]')).toBeInTheDocument();
    expect(navigation.querySelector('a[href="/how-to-play"]')).toBeInTheDocument();
    expect(navigation.querySelector('a[href^="https://github.com"]')).toHaveAttribute(
      'target', '_blank',
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language' })).toBeInTheDocument();
  });

  it('uses a native keyboard-operable control to collapse', () => {
    const onToggle = vi.fn();
    renderSidebar({ onToggle });
    fireEvent.click(screen.getByRole('button', { name: 'Minimize menu' }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('keeps tooltips and a stable desktop width when collapsed', () => {
    renderSidebar({ isCollapsed: true });
    const sidebar = screen.getByTestId('desktop-sidebar');
    expect(sidebar).toHaveClass('w-20');
    expect(sidebar.querySelector('a[title="Home"]')).toBeInTheDocument();
  });
});

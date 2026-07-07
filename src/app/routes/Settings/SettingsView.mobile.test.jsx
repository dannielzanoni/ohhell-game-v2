// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import '@/i18n/index.js';
import { Settings } from './Settings.jsx';

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('Settings mobile screen', () => {
  it('is a scrollable safe-area screen and does not use a compressed 54dvh modal', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    expect(main).toHaveClass(
      'min-h-dvh',
      'overflow-y-auto',
      'pt-[max(1rem,env(safe-area-inset-top))]',
      'pb-[calc(5rem+env(safe-area-inset-bottom))]',
    );
    expect(main).not.toHaveClass('h-[54dvh]');
    expect(screen.getByRole('region', { name: 'Mobile settings sections' })).toBeInTheDocument();
  });

  it('goes back through browser history so the previous route is preserved', () => {
    render(
      <MemoryRouter initialEntries={['/rooms', '/settings']} initialIndex={1}>
        <LocationProbe />
        <Routes>
          <Route path="/rooms" element={<h1>Rooms</h1>} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('location')).toHaveTextContent('/settings');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/rooms');
  });
});

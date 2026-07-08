// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/index.js';
import { BidControls } from './GameView.jsx';

afterEach(cleanup);

describe('BidControls', () => {
  it('enables exactly the unique values received from possible_bids', () => {
    const onBid = vi.fn();
    render(<BidControls onBid={onBid} possibleBids={[0, 2, 2]} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Bid 2' }));
    expect(onBid).toHaveBeenCalledWith(2);
  });

  it('clears actions visually while waiting for the server event', () => {
    render(<BidControls onBid={() => {}} pendingBid={2} possibleBids={[0, 1, 2]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Bid 2 sent. Waiting for the server');
  });
});

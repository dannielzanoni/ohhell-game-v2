import { describe, expect, it, vi } from 'vitest';
import { copyText } from './clipboard.js';

describe('copyText', () => {
  it('copies normalized text through the browser adapter', async () => {
    const writeText = vi.fn();
    await copyText(42, { clipboard: { writeText } });
    expect(writeText).toHaveBeenCalledWith('42');
  });

  it('reports unavailable clipboard capability', async () => {
    await expect(copyText('room', {})).rejects.toMatchObject({ code: 'clipboard_unavailable' });
  });

  it('falls back to a temporary text selection', async () => {
    const input = { remove: vi.fn(), select: vi.fn(), setAttribute: vi.fn(), style: {} };
    const document = {
      body: { appendChild: vi.fn() },
      createElement: vi.fn(() => input),
      execCommand: vi.fn(() => true),
    };
    await copyText('room-link', { document });
    expect(input.value).toBe('room-link');
    expect(input.select).toHaveBeenCalledOnce();
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(input.remove).toHaveBeenCalledOnce();
  });
});

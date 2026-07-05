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
});

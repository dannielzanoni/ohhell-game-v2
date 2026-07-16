import { describe, expect, it } from 'vitest';
import { avatars, resolveAvatar, resolveAvatarSrc } from './avatarRegistry.js';

describe('avatarRegistry', () => {
  it('resolves the current catalog path', () => {
    const avatar = avatars.find((item) => item.id === 'png-1');
    expect(resolveAvatarSrc('/src/shared/assets/profile-pictures/1.png')).toBe(avatar.src);
  });

  it('resolves profile paths stored by the legacy frontend', () => {
    const avatar = avatars.find((item) => item.id === 'gif-1');
    expect(resolveAvatarSrc('../../assets/profile_pictures/gifs/1.gif')).toBe(avatar.src);
  });

  it('resolves stable avatar ids', () => {
    expect(resolveAvatar('png-2')?.id).toBe('png-2');
  });

  it('preserves external profile URLs', () => {
    const googlePicture = 'https://lh3.googleusercontent.com/avatar';
    expect(resolveAvatarSrc(googlePicture)).toBe(googlePicture);
  });
});

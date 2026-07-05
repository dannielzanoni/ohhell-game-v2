const pngAvatars = import.meta.glob('../profile_pictures/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});
const gifAvatars = import.meta.glob('../profile_pictures/gifs/*.gif', {
  eager: true,
  import: 'default',
  query: '?url',
});

function avatarNumber(path) {
  return Number(path.match(/(\d+)\.(png|gif)$/)?.[1] || 0);
}

function toAvatarList(entries, type) {
  return Object.entries(entries)
    .map(([picture, src]) => ({
      id: `${type}-${avatarNumber(picture)}`,
      label: `${type.toUpperCase()} ${avatarNumber(picture)}`,
      labelKey: type === 'gif' ? 'auth.gifs' : 'auth.avatars',
      order: avatarNumber(picture),
      picture,
      src,
      type,
    }))
    .sort((first, second) => first.order - second.order);
}

export const avatarGroups = Object.freeze([
  { labelKey: 'auth.avatars', title: 'png', type: 'png', avatars: toAvatarList(pngAvatars, 'png') },
  { labelKey: 'auth.gifs', title: 'gif', type: 'gif', avatars: toAvatarList(gifAvatars, 'gif') },
]);
export const avatars = Object.freeze(avatarGroups.flatMap((group) => group.avatars));

export function findAvatar(value) {
  if (!value) return null;
  return avatars.find(({ id, picture, src }) =>
    value === id || value === picture || value === src,
  ) || null;
}

export function resolveAvatarSrc(value, fallback = '') {
  return findAvatar(value)?.src || value || fallback;
}

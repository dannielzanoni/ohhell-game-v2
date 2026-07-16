const pngAvatars = import.meta.glob('/src/shared/assets/profile-pictures/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

const gifAvatars = import.meta.glob('/src/shared/assets/profile-pictures/gifs/*.gif', {
  eager: true,
  import: 'default',
  query: '?url',
});

function avatarNumber(path) {
  return Number(path.match(/(\d+)\.(png|gif)$/)?.[1] || 0);
}

function toAvatarList(entries, type) {
  return Object.entries(entries)
    .map(([path, src]) => ({
      id: `${type}-${avatarNumber(path)}`,
      label: `${type.toUpperCase()} ${avatarNumber(path)}`,
      picture: path,
      src,
      type,
      order: avatarNumber(path),
    }))
    .sort((first, second) => first.order - second.order);
}

function getLegacyAvatarIdentity(picture) {
  const normalizedPicture = String(picture || '')
    .replace(/\\/g, '/')
    .split(/[?#]/)[0]
    .toLowerCase();
  const match = normalizedPicture.match(/(?:^|\/)(?:gifs\/)?(\d+)\.(png|gif)$/);

  if (!match) {
    return null;
  }

  return {
    order: Number(match[1]),
    type: match[2],
  };
}

export const avatarGroups = [
  {
    title: 'Avatares',
    avatars: toAvatarList(pngAvatars, 'png'),
  },
  {
    title: 'GIFs',
    avatars: toAvatarList(gifAvatars, 'gif'),
  },
];

export const avatars = avatarGroups.flatMap((group) => group.avatars);

export function resolveAvatar(picture) {
  if (!picture) {
    return null;
  }

  const exactAvatar = avatars.find((avatar) => {
    return avatar.picture === picture || avatar.id === picture || avatar.src === picture;
  });

  if (exactAvatar) {
    return exactAvatar;
  }

  const legacyIdentity = getLegacyAvatarIdentity(picture);
  const legacyAvatar = legacyIdentity
    ? avatars.find((avatar) => {
        return avatar.type === legacyIdentity.type && avatar.order === legacyIdentity.order;
      })
    : null;

  if (legacyAvatar) {
    return legacyAvatar;
  }

  return {
    id: '',
    label: '',
    order: 0,
    picture,
    src: picture,
    type: 'external',
  };
}

export function resolveAvatarSrc(picture) {
  return resolveAvatar(picture)?.src || '';
}

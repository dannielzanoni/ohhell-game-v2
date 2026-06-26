const pngAvatars = import.meta.glob('../../assets/profile_pictures/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

const gifAvatars = import.meta.glob('../../assets/profile_pictures/gifs/*.gif', {
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

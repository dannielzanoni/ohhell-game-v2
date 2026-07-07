const defaultRepositoryUrl = 'https://github.com/dannielzanoni/ohhell-game-v2';

export const externalLinks = Object.freeze({
  repository:
    import.meta.env.VITE_PROJECT_REPOSITORY_URL?.trim() || defaultRepositoryUrl,
});

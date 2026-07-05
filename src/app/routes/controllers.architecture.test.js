import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const routesDirectory = dirname(fileURLToPath(import.meta.url));
const routeNames = [
  'CreateGame',
  'Game',
  'Github',
  'Home',
  'HowToPlay',
  'Leaderboard',
  'Rooms',
  'Settings',
];

describe('feature controller boundaries', () => {
  it.each(routeNames)('%s route mounts a controller and a view', (route) => {
    const source = readFileSync(
      resolve(routesDirectory, route, `${route}.jsx`),
      'utf8',
    );

    expect(source).toMatch(/Controller/);
    expect(source).toMatch(new RegExp(`<${route}View`));
  });

  it.each(routeNames)('%s view does not import services', (route) => {
    const source = readFileSync(
      resolve(routesDirectory, route, `${route}View.jsx`),
      'utf8',
    );

    expect(source).not.toMatch(/from ['"]@\/services\//);
  });
});

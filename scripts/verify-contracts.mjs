import { readFile } from 'node:fs/promises';

const load = async (name) => JSON.parse(
  await readFile(new URL(`../contracts/v1/${name}`, import.meta.url), 'utf8'),
);
const [http, client, server] = await Promise.all([
  load('http-endpoints.json'),
  load('realtime-client.json'),
  load('realtime-server.json'),
]);

const unique = (values) => new Set(values).size === values.length;
if (!unique(http.map(({ id }) => id))) throw new Error('Duplicate HTTP contract id');
if (!unique(client.map(({ type }) => type))) throw new Error('Duplicate client command');
if (!unique(server.map(({ type }) => type))) throw new Error('Duplicate server message');
if (server.length !== 14) throw new Error(`Expected 14 server messages, got ${server.length}`);

for (const id of ['auth.signup', 'auth.profile']) {
  const endpoint = http.find((fixture) => fixture.id === id);
  if (endpoint?.constraints?.nickname?.maxLength !== 24) {
    throw new Error(`${id} must enforce a 24-character nickname`);
  }
}

for (const fixture of [...client, ...server]) {
  if (!fixture.type || !Object.hasOwn(fixture, 'data')) {
    throw new Error('Every realtime fixture requires type and data');
  }
  JSON.parse(JSON.stringify(fixture));
}

console.log(`contracts/v1 valid: ${http.length} HTTP, ${client.length} commands, ${server.length} messages`);

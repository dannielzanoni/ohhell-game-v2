import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }));
  return nested.flat();
}

const files = (await sourceFiles(fileURLToPath(new URL('../src', import.meta.url))))
  .filter((file) => ['.js', '.jsx'].includes(extname(file)))
  .filter((file) => !file.includes('.test.'));

for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (/\bconsole\.(?:debug|error|info|log|trace|warn)\s*\(/.test(source)) {
    throw new Error(`Production console call is forbidden: ${file}`);
  }
}

console.log(`security check passed: ${files.length} production source files`);

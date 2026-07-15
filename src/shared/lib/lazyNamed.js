import { lazy } from 'react';

export function lazyNamed(importer, exportName) {
  return lazy(async () => {
    const module = await importer();

    return { default: module[exportName] };
  });
}

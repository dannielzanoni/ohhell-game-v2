import { useEffect, useMemo, useRef, useState } from 'react';
import { environment } from '@/config/environment.js';
import { cn } from '@/lib/utils.js';

function parseOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function buildEditorUrl(templateUrl) {
  if (!environment.luaStudioUrl || !templateUrl) {
    return '';
  }

  const url = new URL('/editor', environment.luaStudioUrl);
  url.searchParams.set('embed', 'true');
  url.searchParams.set('definitionsUrl', environment.luaDefinitionsUrl);
  url.searchParams.set('templateUrl', templateUrl);

  if (typeof window !== 'undefined') {
    url.searchParams.set('parentOrigin', window.location.origin);
  }

  return url.toString();
}

export function LuaStudioFrame({ className, onSourceChange, source, templateUrl, title }) {
  const frameRef = useRef(null);
  const lastStudioSourceRef = useRef(null);
  const [snippetId, setSnippetId] = useState('');
  const editorUrl = useMemo(() => buildEditorUrl(templateUrl), [templateUrl]);
  const luaStudioOrigin = useMemo(
    () => parseOrigin(environment.luaStudioUrl),
    [],
  );

  const postSource = () => {
    if (!frameRef.current?.contentWindow || !luaStudioOrigin) {
      return;
    }

    frameRef.current.contentWindow.postMessage(
      { type: 'lua-studio:set-source', source: source || '' },
      luaStudioOrigin,
    );
  };

  useEffect(() => {
    if (!luaStudioOrigin) {
      return undefined;
    }

    const onMessage = (event) => {
      if (event.origin !== luaStudioOrigin || typeof event.data !== 'object') {
        return;
      }

      if (
        (event.data?.type === 'lua-studio:changed' ||
          event.data?.type === 'lua-studio:saved') &&
        typeof event.data.source === 'string'
      ) {
        lastStudioSourceRef.current = event.data.source;
        setSnippetId(event.data.snippetId || '');
        onSourceChange(event.data.source);
      }

      if (
        event.data?.type === 'lua-studio:snippet-replaced' &&
        typeof event.data.newSnippetId === 'string'
      ) {
        setSnippetId(event.data.newSnippetId);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [luaStudioOrigin, onSourceChange]);

  useEffect(() => {
    if (source === lastStudioSourceRef.current) {
      return;
    }

    postSource();
  }, [source]);

  if (!editorUrl || !luaStudioOrigin) {
    return (
      <div className={cn('rounded-md border border-input bg-background p-3 text-xs text-muted-foreground', className)}>
        Lua Studio URL is not configured.
      </div>
    );
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <iframe
        ref={frameRef}
        title={title || 'Lua Studio'}
        src={editorUrl}
        className="min-h-[32rem] w-full rounded-md border border-input bg-background"
        onLoad={postSource}
      />
      {snippetId ? (
        <p className="text-[0.68rem] leading-4 text-muted-foreground">
          Lua Studio snippet: {snippetId}. The saved Fodinha entity still stores the Lua source.
        </p>
      ) : null}
    </div>
  );
}

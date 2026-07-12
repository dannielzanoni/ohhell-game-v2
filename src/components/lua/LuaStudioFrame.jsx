import { useEffect, useMemo, useRef, useState } from 'react';
import { environment } from '@/config/environment.js';
import { cn } from '@/lib/utils.js';

const mooncodeApiPrefix = '/mooncode-api';

function parseOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function buildMooncodeApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${mooncodeApiPrefix}${normalizedPath}`;
  }

  return new URL(`/api${normalizedPath}`, environment.luaStudioUrl).toString();
}

async function readMooncodeError(response) {
  try {
    const body = await response.json();
    return body?.error || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

async function mooncodeRequest(path, options = {}) {
  const response = await fetch(buildMooncodeApiUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(await readMooncodeError(response));
    error.status = response.status;
    throw error;
  }

  return response;
}

async function mooncodeJson(path, options) {
  const response = await mooncodeRequest(path, options);
  return response.json();
}

export async function fetchLuaStudioSnippetSource(snippetId) {
  if (!snippetId) {
    return '';
  }

  const snippet = await mooncodeJson(`/snippets/${encodeURIComponent(snippetId)}`);

  if (typeof snippet?.source !== 'string') {
    throw new Error('Mooncode snippet did not include Lua source.');
  }

  return snippet.source;
}

async function createLuaStudioSnippet(source) {
  const snippet = await mooncodeJson('/snippets/recover', {
    body: JSON.stringify({
      definitionsUrl: environment.luaDefinitionsUrl,
      source: source || '',
    }),
    method: 'POST',
  });

  if (!snippet?.id) {
    throw new Error('Mooncode did not return a snippet id.');
  }

  return snippet.id;
}

async function saveLuaStudioSnippetSource(snippetId, source) {
  await mooncodeRequest(`/snippets/${encodeURIComponent(snippetId)}`, {
    body: JSON.stringify({ source: source || '' }),
    method: 'PUT',
  });
}

function withParentOrigin(url) {
  if (typeof window !== 'undefined') {
    url.searchParams.set('parentOrigin', window.location.origin);
  }

  return url;
}

function buildSetupEditorUrl(templateUrl) {
  if (!environment.luaStudioUrl || !templateUrl) {
    return '';
  }

  const url = new URL('/editor', environment.luaStudioUrl);
  url.searchParams.set('embed', 'true');
  url.searchParams.set('definitionsUrl', environment.luaDefinitionsUrl);
  url.searchParams.set('templateUrl', templateUrl);

  return withParentOrigin(url).toString();
}

function buildEmbeddedEditorUrl(snippetId) {
  if (!environment.luaStudioUrl || !snippetId) {
    return '';
  }

  const url = new URL(`/editor/${encodeURIComponent(snippetId)}`, environment.luaStudioUrl);
  url.searchParams.set('embed', 'true');

  return withParentOrigin(url).toString();
}

function buildStandaloneEditorUrl(snippetId) {
  if (!environment.luaStudioUrl || !snippetId) {
    return '';
  }

  return withParentOrigin(new URL(`/editor/${encodeURIComponent(snippetId)}`, environment.luaStudioUrl)).toString();
}

export function LuaStudioFrame({
  className,
  onSnippetChange,
  onSourceChange,
  onValidationChange,
  validationRequest = 0,
  source,
  templateUrl,
  title,
}) {
  const frameRef = useRef(null);
  const openedWindowRef = useRef(null);
  const lastStudioSourceRef = useRef(null);
  const awaitingSourceRef = useRef(null);
  const [snippetId, setSnippetId] = useState('');
  const [isFrameVisible, setIsFrameVisible] = useState(true);
  const [isOpeningTab, setIsOpeningTab] = useState(false);
  const [isReopeningFrame, setIsReopeningFrame] = useState(false);
  const [openTabError, setOpenTabError] = useState('');
  const editorUrl = useMemo(
    () => buildSetupEditorUrl(templateUrl),
    [templateUrl],
  );
  const luaStudioOrigin = useMemo(
    () => parseOrigin(environment.luaStudioUrl),
    [],
  );

  const updateSnippetId = (nextSnippetId) => {
    setSnippetId(nextSnippetId);
    onSnippetChange?.(nextSnippetId);
  };

  const postSource = () => {
    if (!frameRef.current?.contentWindow || !luaStudioOrigin) {
      return;
    }

    awaitingSourceRef.current = source || '';
    frameRef.current.contentWindow.postMessage(
      { type: 'mooncode:set-source', source: source || '' },
      luaStudioOrigin,
    );
  };

  const openSessionInTab = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const tab = window.open('about:blank', '_blank');

    if (!tab) {
      setOpenTabError('Allow pop-ups to open Mooncode in a new tab.');
      return;
    }

    setIsOpeningTab(true);
    setOpenTabError('');

    try {
      let nextSnippetId = snippetId;

      if (nextSnippetId && isFrameVisible) {
        try {
          await saveLuaStudioSnippetSource(nextSnippetId, source);
        } catch (error) {
          if (error.status !== 404) {
            throw error;
          }

          nextSnippetId = '';
        }
      }

      if (!nextSnippetId) {
        nextSnippetId = await createLuaStudioSnippet(source);
      }

      updateSnippetId(nextSnippetId);

      openedWindowRef.current = tab;
      tab.location.href = buildStandaloneEditorUrl(nextSnippetId);
      tab.focus();
      setIsFrameVisible(false);
    } catch (error) {
      tab.close();
      setOpenTabError(error.message || 'Could not open Mooncode in a new tab.');
    } finally {
      setIsOpeningTab(false);
    }
  };

  const reopenIframe = async () => {
    if (!snippetId) {
      setIsFrameVisible(true);
      return;
    }

    setIsReopeningFrame(true);
    setOpenTabError('');

    try {
      const latestSource = await fetchLuaStudioSnippetSource(snippetId);
      lastStudioSourceRef.current = latestSource;
      onSourceChange(latestSource);
      setIsFrameVisible(true);
    } catch (error) {
      setOpenTabError(error.message || 'Could not reopen the Mooncode iframe.');
    } finally {
      setIsReopeningFrame(false);
    }
  };

  useEffect(() => {
    if (!luaStudioOrigin) {
      return undefined;
    }

    const onMessage = (event) => {
      if (
        event.origin !== luaStudioOrigin ||
        typeof event.data !== 'object' ||
        (event.source !== frameRef.current?.contentWindow &&
          event.source !== openedWindowRef.current)
      ) {
        return;
      }

      if (
        (event.data?.type === 'mooncode:changed' ||
          event.data?.type === 'mooncode:saved') &&
        typeof event.data.source === 'string'
      ) {
        if (
          awaitingSourceRef.current !== null &&
          event.data.source !== awaitingSourceRef.current
        ) {
          return;
        }

        awaitingSourceRef.current = null;
        lastStudioSourceRef.current = event.data.source;
        updateSnippetId(event.data.snippetId || '');
        onSourceChange(event.data.source);
      }

      if (
        event.data?.type === 'mooncode:validation' &&
        typeof event.data.source === 'string' &&
        typeof event.data.state === 'string'
      ) {
        onValidationChange?.(event.data);
      }

      if (
        event.data?.type === 'mooncode:snippet-replaced' &&
        typeof event.data.newSnippetId === 'string'
      ) {
        updateSnippetId(event.data.newSnippetId);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [luaStudioOrigin, onSnippetChange, onSourceChange]);

  useEffect(() => {
    if (!validationRequest || !luaStudioOrigin) return;
    const target = isFrameVisible ? frameRef.current?.contentWindow : openedWindowRef.current;
    target?.postMessage({ type: 'mooncode:validate' }, luaStudioOrigin);
  }, [validationRequest, luaStudioOrigin, isFrameVisible]);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.68rem] leading-4 text-muted-foreground">
          {isFrameVisible
            ? 'Edit inline or open the same Mooncode session in a full tab.'
            : 'Mooncode is open in a full tab. Saving this form fetches the latest Lua source.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!isFrameVisible ? (
            <button
              type="button"
              className="rounded-md border border-input px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isReopeningFrame}
              onClick={reopenIframe}
            >
              {isReopeningFrame ? 'Syncing...' : 'Reopen iframe'}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md border border-input px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isOpeningTab}
            onClick={openSessionInTab}
          >
            {isOpeningTab ? 'Opening...' : 'Open in new tab'}
          </button>
        </div>
      </div>
      {isFrameVisible ? (
        <iframe
          ref={frameRef}
          title={title || 'Lua Studio'}
          src={editorUrl}
          className="min-h-[32rem] w-full rounded-md border border-input bg-background"
          onLoad={postSource}
        />
      ) : (
        <div className="rounded-md border border-input bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
          The inline editor is closed. Keep editing in the Mooncode tab, then save this form to pull the full Lua source into Fodinha.
        </div>
      )}
      {openTabError ? (
        <p className="text-[0.68rem] leading-4 text-destructive">{openTabError}</p>
      ) : null}
      {snippetId ? (
        <p className="text-[0.68rem] leading-4 text-muted-foreground">
          Mooncode snippet: {snippetId}. Saving this form fetches the latest Lua source before uploading.
        </p>
      ) : null}
    </div>
  );
}

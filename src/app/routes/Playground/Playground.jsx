import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  ImagePlus,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { cn } from '@/lib/utils.js';
import { isCurrentUserAdmin } from '@/services/authService.js';
import {
  createCardDefinition,
  getCardDefinitions,
  uploadCardDefinitionAsset,
} from '@/services/cardDefinitionsService.js';

const EXPORT_CARD_HEIGHT = 1344;
const EXPORT_CARD_WIDTH = 768;
const PREVIEW_CARD_WIDTH = 384;
const EXPORT_TEXT_Y_OFFSET_RATIO = 0.22;

const textFieldOptions = [
  { key: 'title' },
  { key: 'description' },
  { key: 'life' },
];

const defaultFieldLayout = {
  description: { case: 'none', color: '#1c1917', size: 15, width: 73, x: 12, y: 81.5 },
  life: { case: 'none', color: '#fff7ed', size: 20, width: 16, x: 77.5, y: 91.8 },
  title: { case: 'upper', color: '#fff7ed', size: 26, width: 62, x: 18, y: 5.7 },
};

const defaultImageLayout = {
  height: 63,
  width: 84,
  x: 8,
  y: 10,
};

function createDefaultLayout() {
  return JSON.parse(JSON.stringify(defaultFieldLayout));
}

function createDefaultImageLayout() {
  return { ...defaultImageLayout };
}

const emptyDraft = {
  cardType: 'instant',
  description: '',
  image: '',
  imageLayout: createDefaultImageLayout(),
  layout: createDefaultLayout(),
  life: '',
  luaScript: '',
  template: '',
  title: '',
};

function normalizeCard(card) {
  const cleanedCard = { ...card };
  delete cleanedCard.cost;
  delete cleanedCard.luaScriptName;
  delete cleanedCard.power;
  delete cleanedCard.rarity;
  const cardType = ['instant', 'targetable', 'interactive'].includes(cleanedCard.cardType)
    ? cleanedCard.cardType
    : 'instant';

  const sourceLayout = cleanedCard.layout || {};
  const layout = {};

  textFieldOptions.forEach((field) => {
    layout[field.key] = {
      ...defaultFieldLayout[field.key],
      ...(sourceLayout[field.key] || {}),
    };
  });

  return {
    ...cleanedCard,
    imageLayout: {
      ...createDefaultImageLayout(),
      ...(cleanedCard.imageLayout || {}),
    },
    layout,
    luaScript: typeof cleanedCard.luaScript === 'string' ? cleanedCard.luaScript : '',
    cardType,
  };
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImage(
  file,
  { maxSize = 1000, outputType = 'image/jpeg', quality = 0.82 } = {},
) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      void readImageAsDataUrl(file).then(resolve, reject);
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(outputType, quality));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(imageUrl);
      reject(error);
    };
    img.src = imageUrl;
  });
}

function normalizeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function applyTextCase(value, textCase) {
  const text = String(value ?? '');

  if (textCase === 'upper') {
    return text.toUpperCase();
  }

  if (textCase === 'lower') {
    return text.toLowerCase();
  }

  return text;
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function slugifyFileName(value) {
  const slug = String(value || 'card')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return slug || 'card';
}

function getCardAssetFingerprint(card) {
  const normalizedCard = normalizeCard(card);

  return JSON.stringify({
    description: normalizedCard.description,
    image: normalizedCard.image,
    imageLayout: normalizedCard.imageLayout,
    layout: normalizedCard.layout,
    life: normalizedCard.life,
    luaScript: normalizedCard.luaScript,
    template: normalizedCard.template,
    title: normalizedCard.title,
  });
}

function getCreatorName(item, t) {
  if (item?.kind === 'official' || item?.creator_id === 'official') {
    return t('pages.powerDecks.officialCreator');
  }

  return item?.creator_id || '';
}

function getKindLabelKey(kind) {
  return kind === 'official'
    ? 'pages.powerDecks.kind.official'
    : 'pages.powerDecks.kind.community';
}

function getCardTypeLabelKey(cardType) {
  return `pages.powerDecks.cardTypes.${cardType || 'instant'}`;
}

function getKindBadgeClass(kind) {
  return kind === 'official'
    ? 'border-amber-400/60 bg-amber-400/15 text-amber-700 dark:text-amber-300'
    : 'border-primary/40 bg-primary/10 text-primary';
}

function drawCoverImage(context, image, x, y, width, height) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function wrapCanvasText(context, text, maxWidth) {
  const lines = [];
  const sourceLines = String(text).split(/\r?\n/);

  sourceLines.forEach((sourceLine) => {
    const words = sourceLine.split(/\s+/).filter(Boolean);

    if (!words.length) {
      lines.push('');
      return;
    }

    let currentLine = '';

    words.forEach((word) => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;

      if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
        currentLine = nextLine;
        return;
      }

      lines.push(currentLine);
      currentLine = word;
    });

    lines.push(currentLine);
  });

  return lines;
}

async function renderCardToBlob(card) {
  const normalizedCard = normalizeCard(card);
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_CARD_WIDTH;
  canvas.height = EXPORT_CARD_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context unavailable');
  }

  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (normalizedCard.image) {
    const image = await loadCanvasImage(normalizedCard.image);
    const imageLayout = normalizedCard.imageLayout;
    const x = (imageLayout.x / 100) * canvas.width;
    const y = (imageLayout.y / 100) * canvas.height;
    const width = (imageLayout.width / 100) * canvas.width;
    const height = (imageLayout.height / 100) * canvas.height;

    context.save();
    if (typeof context.roundRect === 'function') {
      context.beginPath();
      context.roundRect(x, y, width, height, 40);
      context.clip();
    }
    drawCoverImage(context, image, x, y, width, height);
    context.restore();
  }

  const template = await loadCanvasImage(normalizedCard.template);
  context.drawImage(template, 0, 0, canvas.width, canvas.height);

  if (document.fonts?.load) {
    await document.fonts.load('52px CardDisplay');
    await document.fonts.ready;
  }

  const textScale = EXPORT_CARD_WIDTH / PREVIEW_CARD_WIDTH;

  textFieldOptions.forEach((field) => {
    const layout = normalizedCard.layout?.[field.key] || defaultFieldLayout[field.key];
    const rawValue = normalizedCard[field.key] ?? field.defaultValue ?? '';
    const text = applyTextCase(rawValue || field.defaultValue, layout.case);
    const isDescription = field.key === 'description';
    const isCentered = field.key === 'title' || field.key === 'life';
    const fontSize = layout.size * textScale;
    const lineHeight = fontSize * (isDescription ? 1.08 : 1);
    const x = (layout.x / 100) * canvas.width;
    const y =
      (layout.y / 100) * canvas.height + fontSize * EXPORT_TEXT_Y_OFFSET_RATIO;
    const width = (layout.width / 100) * canvas.width;

    context.save();
    context.fillStyle = layout.color;
    context.font = `900 ${fontSize}px CardDisplay, serif`;
    context.textAlign = isCentered ? 'center' : 'left';
    context.textBaseline = 'top';
    context.shadowBlur = isDescription ? 2 : 6;
    context.shadowColor = isDescription
      ? 'rgba(255,255,255,0.25)'
      : 'rgba(0,0,0,0.95)';
    context.shadowOffsetX = 0;
    context.shadowOffsetY = isDescription ? 2 : 4;

    const lines = wrapCanvasText(context, text, width);

    lines.forEach((line, index) => {
      context.fillText(
        line,
        isCentered ? x + width / 2 : x,
        y + index * lineHeight,
        width,
      );
    });
    context.restore();
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Could not create card image'));
    }, 'image/png');
  });
}

function CardTextField({ card, compact, fieldKey }) {
  const layout = card.layout?.[fieldKey] || defaultFieldLayout[fieldKey];
  const field = textFieldOptions.find((item) => item.key === fieldKey);
  const rawValue = card[fieldKey] ?? field?.defaultValue ?? '';
  const isDescription = fieldKey === 'description';
  const isNumber = fieldKey === 'life';
  const fontScale = compact ? 0.42 : 1;

  return (
    <div
      className={cn(
        'absolute z-20 overflow-hidden text-red-50 drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]',
        isNumber ? 'text-center font-black' : 'font-black',
        isDescription && 'text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.25)]',
      )}
      style={{
        color: layout.color,
        fontFamily: 'CardDisplay, serif',
        fontSize: `${layout.size * fontScale}px`,
        left: `${layout.x}%`,
        lineHeight: isDescription ? 1.08 : 1,
        textAlign: isNumber || fieldKey === 'title' ? 'center' : 'left',
        top: `${layout.y}%`,
        width: `${layout.width}%`,
      }}
    >
      {applyTextCase(rawValue || field?.defaultValue, layout.case)}
    </div>
  );
}

function MagicCardPreview({ card, className, compact = false }) {
  const normalizedCard = normalizeCard(card);
  const imageLayout = normalizedCard.imageLayout;

  return (
    <article
      className={cn(
        'relative aspect-[768/1344] w-full max-w-[24rem] overflow-hidden rounded-lg bg-black shadow-2xl shadow-black/40 ring-1 ring-red-950/60',
        className,
      )}
    >
      <div
        className="absolute z-0 overflow-hidden rounded-[1.25rem]"
        style={{
          height: `${imageLayout.height}%`,
          left: `${imageLayout.x}%`,
          top: `${imageLayout.y}%`,
          width: `${imageLayout.width}%`,
        }}
      >
        {normalizedCard.image ? (
          <img
            src={normalizedCard.image}
            alt=""
            className="size-full object-cover"
            draggable="false"
          />
        ) : null}
      </div>

      {normalizedCard.template ? (
        <img
          src={normalizedCard.template}
          alt=""
          className="pointer-events-none absolute inset-0 z-10 size-full object-cover"
          draggable="false"
        />
      ) : null}

      {textFieldOptions.map((field) => (
        <CardTextField
          key={field.key}
          card={normalizedCard}
          compact={compact}
          fieldKey={field.key}
        />
      ))}
    </article>
  );
}

function LayoutNumberInput({ label, max, min, onChange, value }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
      {label}
      <Input
        max={max}
        min={min}
        step="0.1"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FieldLayoutControls({ draft, onChange, t }) {
  return (
    <div className="mt-5 rounded-lg border border-border bg-background/45 p-4">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {t('pages.playground.layout.eyebrow')}
        </p>
        <h3 className="text-base font-black">
          {t('pages.playground.layout.title')}
        </h3>
      </div>

      <div className="mt-4 grid gap-3">
        {textFieldOptions.map((field) => {
          const layout = draft.layout?.[field.key] || defaultFieldLayout[field.key];
          const label = t(`pages.playground.fields.${field.key}`);

          return (
            <details
              key={field.key}
              className="rounded-lg border border-border bg-card p-3"
            >
              <summary className="cursor-pointer text-sm font-black">
                {label}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <LayoutNumberInput
                  label="X"
                  max="100"
                  min="0"
                  value={layout.x}
                  onChange={(value) => onChange(field.key, 'x', value)}
                />
                <LayoutNumberInput
                  label="Y"
                  max="100"
                  min="0"
                  value={layout.y}
                  onChange={(value) => onChange(field.key, 'y', value)}
                />
                <LayoutNumberInput
                  label={t('pages.playground.layout.width')}
                  max="100"
                  min="1"
                  value={layout.width}
                  onChange={(value) => onChange(field.key, 'width', value)}
                />
                <LayoutNumberInput
                  label={t('pages.playground.layout.size')}
                  max="72"
                  min="6"
                  value={layout.size}
                  onChange={(value) => onChange(field.key, 'size', value)}
                />
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                  {t('pages.playground.layout.color')}
                  <input
                    type="color"
                    className="h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent p-1 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={layout.color}
                    onChange={(event) =>
                      onChange(field.key, 'color', event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground sm:col-span-2">
                  {t('pages.playground.layout.case')}
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    value={layout.case}
                    onChange={(event) =>
                      onChange(field.key, 'case', event.target.value)
                    }
                  >
                    <option value="none">
                      {t('pages.playground.layout.caseOptions.none')}
                    </option>
                    <option value="upper">
                      {t('pages.playground.layout.caseOptions.upper')}
                    </option>
                    <option value="lower">
                      {t('pages.playground.layout.caseOptions.lower')}
                    </option>
                  </select>
                </label>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function ImageLayoutControls({ draft, onChange, t }) {
  const layout = draft.imageLayout || defaultImageLayout;

  return (
    <div className="mt-5 rounded-lg border border-border bg-background/45 p-4">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {t('pages.playground.imageLayout.eyebrow')}
        </p>
        <h3 className="text-base font-black">
          {t('pages.playground.imageLayout.title')}
        </h3>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <LayoutNumberInput
          label="X"
          max="100"
          min="-100"
          value={layout.x}
          onChange={(value) => onChange('x', value)}
        />
        <LayoutNumberInput
          label="Y"
          max="100"
          min="-100"
          value={layout.y}
          onChange={(value) => onChange('y', value)}
        />
        <LayoutNumberInput
          label={t('pages.playground.layout.width')}
          max="200"
          min="1"
          value={layout.width}
          onChange={(value) => onChange('width', value)}
        />
        <LayoutNumberInput
          label={t('pages.playground.imageLayout.height')}
          max="200"
          min="1"
          value={layout.height}
          onChange={(value) => onChange('height', value)}
        />
      </div>
    </div>
  );
}

export function Playground() {
  const { t } = useTranslation();
  const assetInputRef = useRef(null);
  const assetUploadRef = useRef(null);
  const templateInputRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [draft, setDraft] = useState(() => normalizeCard(emptyDraft));
  const [cardsError, setCardsError] = useState('');
  const [imageError, setImageError] = useState('');
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isOfficialCard, setIsOfficialCard] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [stagedAsset, setStagedAsset] = useState(null);
  const canCreateOfficial = isCurrentUserAdmin();
  const draftAssetFingerprint = getCardAssetFingerprint(draft);

  const loadCards = async () => {
    setIsLoadingCards(true);
    setCardsError('');

    try {
      const response = await getCardDefinitions();
      setCards(Array.isArray(response) ? response : []);
    } catch (error) {
      setCardsError(error.message || t('pages.playground.loadError'));
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    void loadCards();
  }, []);

  useEffect(() => {
    const normalizedDraft = normalizeCard(draft);

    if (!normalizedDraft.template || !normalizedDraft.luaScript.trim()) {
      assetUploadRef.current = null;
      setStagedAsset(null);
      return undefined;
    }

    const fingerprint = draftAssetFingerprint;

    if (stagedAsset?.fingerprint === fingerprint) {
      return undefined;
    }

    const abortController = new AbortController();
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      const promise = (async () => {
        const imageBlob = await renderCardToBlob(normalizedDraft);

        if (abortController.signal.aborted) {
          return null;
        }

        return uploadCardDefinitionAsset({
          imageBlob,
          scriptFileName: `${slugifyFileName(normalizedDraft.title)}.lua`,
          scriptText: normalizedDraft.luaScript,
          signal: abortController.signal,
        });
      })();

      assetUploadRef.current = {
        abortController,
        fingerprint,
        promise,
      };

      promise
        .then((asset) => {
          if (!cancelled && asset) {
            setStagedAsset({ ...asset, fingerprint });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setStagedAsset(null);
          }
        });
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [draftAssetFingerprint]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateFieldLayout = (fieldKey, property, value) => {
    setDraft((current) => {
      const fallback = defaultFieldLayout[fieldKey][property];
      const nextValue =
        property === 'case' || property === 'color'
          ? value
          : normalizeNumber(value, fallback);

      return {
        ...current,
        layout: {
          ...normalizeCard(current).layout,
          [fieldKey]: {
            ...defaultFieldLayout[fieldKey],
            ...(current.layout?.[fieldKey] || {}),
            [property]: nextValue,
          },
        },
      };
    });
  };

  const updateImageLayout = (property, value) => {
    setDraft((current) => ({
      ...current,
      imageLayout: {
        ...createDefaultImageLayout(),
        ...(current.imageLayout || {}),
        [property]: normalizeNumber(value, defaultImageLayout[property]),
      },
    }));
  };

  const handleAssetImageChange = async (event) => {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    setImageError('');

    try {
      const image = await resizeImage(file);
      updateDraft('image', image);
    } catch {
      setImageError(t('pages.playground.imageError'));
    } finally {
      event.target.value = '';
    }
  };

  const handleTemplateImageChange = async (event) => {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    setImageError('');

    try {
      const template = await resizeImage(file, {
        maxSize: 1600,
        outputType: 'image/png',
      });
      updateDraft('template', template);
    } catch {
      setImageError(t('pages.playground.templateError'));
    } finally {
      event.target.value = '';
    }
  };

  const resetDraft = () => {
    assetUploadRef.current?.abortController?.abort();
    assetUploadRef.current = null;
    setStagedAsset(null);
    setDraft(normalizeCard(emptyDraft));
    setIsOfficialCard(false);
    setImageError('');
    setPublishError('');
    setPublishSuccess('');
  };

  const saveCard = async (event) => {
    event.preventDefault();
    await publishCommunityCard();
  };

  const exportCards = () => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ohhell-magic-cards.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCardImage = async () => {
    if (!draft.template) {
      setImageError(t('pages.playground.templateRequired'));
      return;
    }

    setImageError('');

    try {
      const blob = await renderCardToBlob(draft);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slugifyFileName(draft.title)}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setImageError(t('pages.playground.renderError'));
    }
  };

  const publishCommunityCard = async () => {
    if (!draft.template) {
      setPublishError(t('pages.playground.templateRequired'));
      return;
    }

    if (!draft.luaScript.trim()) {
      setPublishError(t('pages.playground.luaRequired'));
      return;
    }

    setIsPublishing(true);
    setPublishError('');
    setPublishSuccess('');

    try {
      const life = draft.life === '' ? '' : normalizeNumber(draft.life, 0);
      const fingerprint = draftAssetFingerprint;
      let assetId =
        stagedAsset?.fingerprint === fingerprint ? stagedAsset.asset_id : null;

      if (!assetId && assetUploadRef.current?.fingerprint === fingerprint) {
        try {
          const asset = await assetUploadRef.current.promise;
          assetId = asset?.asset_id || null;
        } catch {
          assetId = null;
        }
      }

      const imageBlob = assetId ? null : await renderCardToBlob(draft);
      const card = await createCardDefinition({
        assetId,
        cardType: draft.cardType,
        description: draft.description,
        imageBlob,
        kind: canCreateOfficial && isOfficialCard ? 'official' : 'community',
        life,
        name: draft.title.trim() || t('pages.playground.untitled'),
        scriptFileName: `${slugifyFileName(draft.title)}.lua`,
        scriptText: draft.luaScript,
      });

      setCards((current) => [
        card,
        ...current.filter((currentCard) => currentCard.id !== card.id),
      ]);
      setDraft(normalizeCard(emptyDraft));
      setIsOfficialCard(false);
      setStagedAsset(null);
      assetUploadRef.current = null;
      setImageError('');

      setPublishSuccess(
        t('pages.playground.publishSuccess', { name: card.name || draft.title }),
      );
    } catch (error) {
      setPublishError(error.message || t('pages.playground.publishError'));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-primary">
            {t('pages.playground.eyebrow')}
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {t('pages.playground.title')}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {t('pages.playground.description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 cursor-pointer gap-2"
                onClick={resetDraft}
              >
                <Plus className="size-4" />
                {t('pages.playground.newCard')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 cursor-pointer gap-2"
                disabled={isLoadingCards}
                onClick={() => void loadCards()}
              >
                <RefreshCw className={cn('size-4', isLoadingCards && 'animate-spin')} />
                {t('common.refresh')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 cursor-pointer gap-2"
                disabled={!cards.length}
                onClick={exportCards}
              >
                <Download className="size-4" />
                {t('pages.playground.export')}
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 2xl:grid-cols-[minmax(50rem,1.15fr)_minmax(22rem,0.85fr)]">
          <section className="grid gap-5 lg:grid-cols-[minmax(18rem,24rem)_minmax(24rem,1fr)] lg:items-start">
            <div className="flex justify-center rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-6">
              <MagicCardPreview card={draft} />
            </div>

            <form
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
              onSubmit={saveCard}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('pages.playground.drafting')}
                  </p>
                  <h2 className="text-xl font-black">
                    {t('pages.playground.cardData')}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label={t('pages.playground.clear')}
                  className="cursor-pointer"
                  onClick={resetDraft}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                  {t('pages.playground.fields.title')}
                  <Input
                    value={draft.title}
                    onChange={(event) => updateDraft('title', event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  {t('pages.playground.fields.life')}
                  <Input
                    min="0"
                    type="number"
                    value={draft.life}
                    onChange={(event) => updateDraft('life', event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                  {t('pages.playground.fields.description')}
                  <Textarea
                    className="min-h-28 resize-none"
                    value={draft.description}
                    onChange={(event) =>
                      updateDraft('description', event.target.value)
                    }
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                  {t('pages.playground.fields.cardType')}
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.cardType}
                    onChange={(event) => updateDraft('cardType', event.target.value)}
                  >
                    <option value="instant">{t('pages.playground.cardTypes.instant')}</option>
                    <option value="targetable">{t('pages.playground.cardTypes.targetable')}</option>
                    <option value="interactive">{t('pages.playground.cardTypes.interactive')}</option>
                  </select>
                </label>

                {canCreateOfficial ? (
                  <label className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 cursor-pointer accent-amber-500"
                      checked={isOfficialCard}
                      onChange={(event) => setIsOfficialCard(event.target.checked)}
                    />
                    <span>
                      <span className="font-black">
                        {t('pages.playground.officialCard')}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {t('pages.playground.officialCardHint')}
                      </span>
                    </span>
                  </label>
                ) : null}
              </div>

              <FieldLayoutControls
                draft={draft}
                t={t}
                onChange={updateFieldLayout}
              />

              <div className="mt-5 grid gap-3 rounded-lg border border-dashed border-border bg-muted/35 p-4">
                <input
                  ref={templateInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleTemplateImageChange(event)}
                />
                <input
                  ref={assetInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleAssetImageChange(event)}
                />

                <div className="grid gap-4">
                  <div className="rounded-lg border border-border bg-background/45 p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('pages.playground.templateImage')}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 cursor-pointer gap-2"
                        onClick={() => templateInputRef.current?.click()}
                      >
                        <ImagePlus className="size-4" />
                        {t('pages.playground.importTemplate')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 cursor-pointer gap-2"
                        disabled={!draft.template}
                        onClick={() => updateDraft('template', '')}
                      >
                        <Trash2 className="size-4" />
                        {t('pages.playground.removeTemplate')}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background/45 p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('pages.playground.assetImage')}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 cursor-pointer gap-2"
                        onClick={() => assetInputRef.current?.click()}
                      >
                        <ImagePlus className="size-4" />
                        {t('pages.playground.importImage')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 cursor-pointer gap-2"
                        disabled={!draft.image}
                        onClick={() => updateDraft('image', '')}
                      >
                        <Trash2 className="size-4" />
                        {t('pages.playground.removeImage')}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background/45 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        {t('pages.playground.luaScript')}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 cursor-pointer gap-2 px-2"
                        disabled={!draft.luaScript}
                        onClick={() => updateDraft('luaScript', '')}
                      >
                        <Trash2 className="size-4" />
                        {t('pages.playground.removeLua')}
                      </Button>
                    </div>
                    <Textarea
                      aria-label={t('pages.playground.luaScript')}
                      className="mt-3 min-h-48 resize-y font-mono text-xs leading-5"
                      spellCheck={false}
                      value={draft.luaScript}
                      onChange={(event) => updateDraft('luaScript', event.target.value)}
                    />
                  </div>
                </div>

                {imageError ? (
                  <p className="text-sm font-semibold text-destructive">
                    {imageError}
                  </p>
                ) : (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t('pages.playground.imageHint')}
                  </p>
                )}
              </div>

              <ImageLayoutControls
                draft={draft}
                t={t}
                onChange={updateImageLayout}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  type="submit"
                  className="h-11 w-full cursor-pointer gap-2"
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <i className="pi pi-spin pi-spinner text-sm" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isPublishing
                    ? t('pages.playground.publishing')
                    : t('pages.playground.saveCard')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full cursor-pointer gap-2"
                  onClick={() => void exportCardImage()}
                >
                  <Download className="size-4" />
                  {t('pages.playground.saveImage')}
                </Button>
              </div>

              {publishError || publishSuccess ? (
                <div
                  className={cn(
                    'mt-4 rounded-lg border px-4 py-3 text-sm font-semibold',
                    publishError
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600',
                  )}
                >
                  {publishError || publishSuccess}
                  {publishSuccess ? (
                    <Button asChild variant="link" className="ml-2 h-auto p-0">
                      <Link to="/power-decks">
                        {t('pages.playground.viewCommunityCards')}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </form>
          </section>

          <section className="flex flex-col gap-5">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('pages.playground.storage')}
                  </p>
                  <h2 className="text-xl font-black">
                    {t('pages.playground.savedCards', { count: cards.length })}
                  </h2>
                </div>
              </div>

              {cardsError ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  {cardsError}
                </div>
              ) : null}

              {isLoadingCards ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-72 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : cards.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cards.map((card) => {
                    const isOfficial = card.kind === 'official';

                    return (
                      <article
                        key={card.id}
                        className={cn(
                          'overflow-hidden rounded-lg border bg-background shadow-sm',
                          isOfficial
                            ? 'border-amber-400/70 bg-amber-400/5 shadow-amber-950/10'
                            : 'border-border',
                        )}
                      >
                        <div className="aspect-[768/1344] bg-muted">
                          {card.image_url ? (
                            <img
                              src={card.image_url}
                              alt={card.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div
                              className={cn(
                                'grid size-full place-items-center p-6 text-center text-white',
                                isOfficial
                                  ? 'bg-gradient-to-br from-amber-900 via-slate-950 to-yellow-600/70'
                                  : 'bg-gradient-to-br from-violet-950 via-slate-950 to-primary/60',
                              )}
                            >
                              <div>
                                <Sparkles className="mx-auto size-9 text-violet-100" />
                                <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-violet-100/80">
                                  {t(getKindLabelKey(card.kind))}
                                </p>
                                <p className="mt-2 line-clamp-3 text-lg font-black leading-tight">
                                  {card.name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="grid gap-3 p-3">
                          <div>
                            <p className="line-clamp-1 text-sm font-black">{card.name}</p>
                            <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                              {card.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span
                              className={cn(
                                'rounded-full border px-2.5 py-1',
                                getKindBadgeClass(card.kind),
                              )}
                            >
                              {t(getKindLabelKey(card.kind))}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
                              <Target className="size-3.5" />
                              {t(getCardTypeLabelKey(card.type))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                            <UserRound className="size-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">
                              {t('pages.powerDecks.createdBy', {
                                name: getCreatorName(card, t),
                              })}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-background/60 px-4 py-8 text-center">
                  <div>
                    <Save className="mx-auto size-9 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold">
                      {t('pages.playground.emptySavedTitle')}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('pages.playground.emptySavedDescription')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

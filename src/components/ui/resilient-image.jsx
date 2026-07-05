import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function ResilientImage({ alt = '', className, fallbackLabel, onError, src, ...props }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <span
        {...props}
        role={alt || fallbackLabel ? 'img' : undefined}
        aria-label={fallbackLabel || alt || undefined}
        className={cn('grid place-items-center bg-muted text-muted-foreground', className)}
      >
        <ImageOff aria-hidden="true" className="size-1/3 min-h-4 min-w-4" />
      </span>
    );
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}

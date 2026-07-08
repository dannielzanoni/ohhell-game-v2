import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils.js';
import { ResilientImage } from '@/components/ui/resilient-image.jsx';
import { pageLinks } from '../pageLinks.js';

const shortcutClassName = 'group min-h-11 rounded-lg border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background lg:p-4';

export function HomeShortcuts() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('pages.home.shortcuts')}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-3"
    >
      {pageLinks.map((page) => {
        const Icon = page.icon;
        const label = page.labelKey ? t(page.labelKey) : page.label;
        const description = page.descriptionKey
          ? t(page.descriptionKey)
          : page.description;
        const content = (
          <>
            <span className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground lg:size-9">
                {Icon ? (
                  <Icon aria-hidden="true" className="size-5 lg:size-4" />
                ) : page.primeIcon ? (
                  <i aria-hidden="true" className={cn(page.primeIcon, 'text-lg lg:text-base')} />
                ) : (
                  <ResilientImage src={page.iconSrc} alt="" className="size-5 object-contain lg:size-4" />
                )}
              </span>
              <span className="text-xl font-bold text-foreground lg:text-base">
                {label}
              </span>
              {page.externalUrl ? <ExternalLink aria-hidden="true" className="ml-auto size-4" /> : null}
            </span>
            <span className="mt-4 block text-sm leading-6 text-muted-foreground lg:mt-3 lg:text-xs lg:leading-5">
              {description}
            </span>
          </>
        );

        if (page.externalUrl) {
          return (
            <a
              key={page.path}
              href={page.externalUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${label} (${t('common.opensNewWindow')})`}
              className={shortcutClassName}
            >
              {content}
            </a>
          );
        }

        return (
          <Link key={page.path} to={page.path} aria-label={label} className={shortcutClassName}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

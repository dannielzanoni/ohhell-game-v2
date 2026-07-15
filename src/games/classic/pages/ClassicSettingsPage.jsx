import { useTranslation } from 'react-i18next';
import { RoutePage } from '@/games/classic/components/ClassicRoutePage.jsx';

export function Settings() {
  const { t } = useTranslation();

  return (
    <RoutePage
      title={t('pages.settings.title')}
      description={t('pages.settings.description')}
    />
  );
}

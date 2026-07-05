import { useTranslation } from 'react-i18next';
import { RoutePage } from '../RoutePage.jsx';

export function HowToPlayView() {
  const { t } = useTranslation();

  return (
    <RoutePage
      title={t('pages.howToPlay.title')}
      description={t('pages.howToPlay.description')}
    />
  );
}

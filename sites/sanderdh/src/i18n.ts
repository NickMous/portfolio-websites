import { createSiteI18n } from '@portfolio/ui-kit';
import en from './i18n/en';
import nl from './i18n/nl';

export const { locale, t } = createSiteI18n({ en, nl });

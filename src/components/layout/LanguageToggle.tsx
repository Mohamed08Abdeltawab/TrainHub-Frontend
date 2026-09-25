import { Languages } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLanguage } from '../../i18n/LanguageContext';

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const nextLanguage = language === 'en' ? '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' : 'English';
  return (
    <Button type="button" variant="outline" size="sm" onClick={toggleLanguage} aria-label={`Switch language to ${nextLanguage}`} className="gap-1.5">
      <Languages className="size-3.5" aria-hidden="true" />
      {nextLanguage}
    </Button>
  );
}

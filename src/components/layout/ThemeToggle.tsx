import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const nextTheme = theme === 'dark' ? 'Light mode' : 'Dark mode';
  return (
    <Button type="button" variant="outline" size="sm" onClick={toggleTheme} aria-label={t(`Switch to ${nextTheme.toLowerCase()}`)} className="gap-1.5">
      {theme === 'dark' ? <Sun className="size-3.5" aria-hidden="true" /> : <Moon className="size-3.5" aria-hidden="true" />}
      {t(nextTheme)}
    </Button>
  );
}

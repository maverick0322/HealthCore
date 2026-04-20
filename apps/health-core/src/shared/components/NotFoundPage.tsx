import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { SettingsBar } from '@/shared/components/SettingsBar';

/**
 * 404 page shown when no route matches the current URL.
 */
export const NotFoundPage = () => {
  const { t } = useTranslation('auth');

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground font-sans relative transition-colors duration-500 ease-in-out">

      <SettingsBar />

      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tighter text-foreground">404</h1>
          <p className="text-lg font-medium text-foreground">{t('notFoundTitle')}</p>
          <p className="text-sm text-muted-foreground leading-relaxed px-4">
            {t('notFoundSubtitle')}
          </p>
        </div>

        {/* Action */}
        <Link to="/login">
          <Button className="h-11 px-8 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            {t('notFoundAction')}
          </Button>
        </Link>

        <footer className="pt-8 pb-4">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {t('footer')}
          </p>
        </footer>
      </div>
    </div>
  );
};

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import type { Role } from '../types';
import { useI18n } from '../i18n';
import { useCurrentUser } from '../store/selectors';
import { EmptyState } from './ui';

/** Protège un espace : connexion requise et rôle autorisé. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { t } = useI18n();
  const user = useCurrentUser();
  const { pathname } = useLocation();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={<Lock size={36} />}
          text={user ? t('common.wrongRole') : t('common.loginRequired')}
          action={
            <Link to={`/login?redirect=${encodeURIComponent(pathname)}`} className="btn-primary btn-sm">
              {t('common.goLogin')}
            </Link>
          }
        />
      </div>
    );
  }
  return <>{children}</>;
}

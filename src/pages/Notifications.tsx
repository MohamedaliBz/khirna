import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { useCurrentUser } from '../store/selectors';
import { markAllRead, markRead } from '../services/notifications';
import { useNotificationText } from '../components/hooks';
import { EmptyState, PageHeader } from '../components/ui';

export default function Notifications() {
  const { t, dateTime } = useI18n();
  const db = useStore();
  const user = useCurrentUser();
  const text = useNotificationText();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container-app py-16">
        <EmptyState text={t('common.loginRequired')} action={<Link to="/login" className="btn-primary btn-sm">{t('common.goLogin')}</Link>} />
      </div>
    );
  }
  const list = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="container-app max-w-3xl py-8">
      <PageHeader
        title={t('notifications.title')}
        icon={<Bell size={24} />}
        actions={
          list.some((n) => !n.read) && (
            <button className="btn-secondary btn-sm" onClick={markAllRead}>
              <CheckCheck size={16} /> {t('notifications.markAllRead')}
            </button>
          )
        }
      />
      {list.length === 0 ? (
        <EmptyState icon={<Bell size={36} />} text={t('notifications.empty')} />
      ) : (
        <ul className="card divide-y divide-ink/5 overflow-hidden">
          {list.map((n) => (
            <li key={n.id}>
              <button
                className={`flex w-full gap-3 px-4 py-4 text-start hover:bg-cream ${n.read ? 'text-ink-soft' : 'bg-primary-50/40 font-semibold'}`}
                onClick={() => {
                  markRead(n.id);
                  if (n.link) navigate(n.link);
                }}
              >
                <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? 'bg-ink/10' : 'bg-wheat'}`} />
                <span className="text-sm">
                  {text(n)}
                  <span className="mt-1 block text-xs font-normal text-ink-muted">{dateTime(n.date)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

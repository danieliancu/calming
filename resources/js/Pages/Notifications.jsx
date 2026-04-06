import AppLayout from '@/Layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
    buildGuestNotifications,
    markAllGuestNotificationsRead,
    markGuestNotificationRead,
    markGuestNotificationUnread,
} from '@/lib/guestActivity';
import { apiFetch } from '@/lib/http';
import { emitNotificationSync } from '@/lib/notificationSync';
import { FiBell, FiCheck, FiReply, ICON_BY_NAME } from '@/lib/icons';
import { Head, Link } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

export default function Notifications({ notifications, guestDefaults, unreadCount, notificationsEnabled = true }) {
    const { isAuthenticated, refreshAuth } = useAuth();
    const [items, setItems] = useState(() => (
        !notificationsEnabled
            ? []
            : (
        isAuthenticated
            ? notifications
            : buildGuestNotifications([...(notifications ?? []), ...(guestDefaults ?? [])])
            )
    ));

    if (!notificationsEnabled) {
        return (
            <>
                <Head title="Notificări - Calming" />
                <section className="notification-page">
                    <div className="card">
                        <div className="section-title">Notificări</div>
                        <p className="muted">Notificările sunt dezactivate din setări.</p>
                    </div>
                </section>
            </>
        );
    }
    const handleToggleRead = useCallback(async (item) => {
        const nextReadState = !item.is_read;

        if (isAuthenticated && typeof item.id === 'number') {
            if (nextReadState) {
                await apiFetch('/api/notifications/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationId: item.id }),
                });
            } else {
                await apiFetch(`/api/notifications/${item.id}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'unread' }),
                });
            }
            await refreshAuth();
            emitNotificationSync({ source: 'notifications-page', action: nextReadState ? 'read' : 'unread' });
        } else if (nextReadState) {
            markGuestNotificationRead(item.id);
        } else {
            markGuestNotificationUnread(item.id);
        }

        setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, is_read: nextReadState, is_new: nextReadState ? false : entry.is_new } : entry)));
    }, [isAuthenticated, refreshAuth]);

    const handleMarkAllRead = useCallback(async () => {
        if (isAuthenticated) {
            await apiFetch('/api/notifications/read-all', { method: 'POST' });
            await refreshAuth();
            emitNotificationSync({ source: 'notifications-page', action: 'read-all' });
        } else {
            markAllGuestNotificationsRead(items.map((item) => item.id));
        }

        setItems((current) => current.map((item) => ({ ...item, is_read: true, is_new: false })));
    }, [isAuthenticated, items, refreshAuth]);

    const todayItems = [];
    const earlierItems = [];
    const readItems = [];
    const now = new Date();

    items.forEach((item) => {
        const createdAt = item.published_at ? new Date(item.published_at) : item.created_at ? new Date(item.created_at) : null;
        const data = {
            ...item,
            time: item.relative_time ?? (createdAt ? formatRelativeTime(createdAt, now) : null),
            tag: !item.is_read && (item.is_new || (createdAt && isRecent(createdAt, now))) ? 'Nou' : null,
        };

        if (item.is_read) {
            readItems.push(data);
            return;
        }

        if (createdAt && isSameDay(createdAt, now)) {
            todayItems.push(data);
            return;
        }

        earlierItems.push(data);
    });

    if (!items.length) {
        return (
            <>
                <Head title="Notificări - Calming" />
                <section className="notification-page">
                    <div className="card">
                        <div className="section-title">Notificări</div>
                        <p className="muted">Nu ai notificări noi în acest moment.</p>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <Head title="Notificări - Calming" />
            <section className="notification-page">
                <div className="card notification-toolbar">
                    <div className="section-title">Notificări</div>
                    <button className="notification-toolbar__action" type="button" onClick={handleMarkAllRead}>
                        <span className="notification-toolbar__icon" aria-hidden>
                            <FiCheck size={12} />
                        </span>
                        <span>Bifează toate citite</span>
                    </button>
                </div>
                <NotificationBlock title="Astăzi" highlight items={todayItems} onToggleRead={handleToggleRead} />
                <NotificationBlock title="Mai devreme" items={earlierItems} onToggleRead={handleToggleRead} />
                <NotificationBlock title="Citite" items={readItems} onToggleRead={handleToggleRead} />
            </section>
        </>
    );
}

function NotificationBlock({ title, items, highlight, onToggleRead }) {
    if (!items.length) {
        return null;
    }

    return (
        <section className="notification-block">
            <h2 className={`notification-heading${highlight ? ' today' : ''}`}>{title}</h2>
            <div className="notification-list">
                {items.map((item) => (
                    <NotificationCard key={item.id} {...item} onToggleRead={() => onToggleRead(item)} />
                ))}
            </div>
        </section>
    );
}

function NotificationCard({ title, body, message, time, tag, icon, accent, cta, is_read, onToggleRead }) {
    const Icon = ICON_BY_NAME[icon] ?? FiBell;
    return (
        <article className={`notification-card${accent ? ` accent-${accent}` : ''}${!is_read ? ' notification-card--unread' : ''}`}>
            <div className="notification-icon">
                <Icon size={22} aria-hidden />
            </div>
            <div className="notification-content">
                <div className="notification-header">
                    <span className="notification-title">{title}</span>
                    <div className="notification-header__actions">
                        {tag ? <span className="notification-badge">{tag}</span> : null}
                        <button
                            type="button"
                            className={`notification-read-button${is_read ? ' is-read' : ''}`}
                            onClick={onToggleRead}
                            aria-label={is_read ? 'Scoate din citite' : 'Marcheaza ca citita'}
                            title={is_read ? 'Scoate din citite' : 'Marcheaza ca citita'}
                        >
                            {is_read ? <FiReply size={12} aria-hidden /> : <FiCheck size={12} aria-hidden />}
                        </button>
                    </div>
                </div>
                <p className="notification-body">{body ?? message}</p>
                <div className="notification-actions">
                    {time ? <span className="notification-time">{time}</span> : null}
                    {cta?.href ? <Link href={cta.href} className="notification-inline-link">{cta.label ?? 'Open'}</Link> : null}
                </div>
            </div>
        </article>
    );
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isRecent(date, now) {
    return now.getTime() - date.getTime() <= 1000 * 60 * 60 * 12;
}

function formatRelativeTime(date, now) {
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes <= 0) {
        return 'Acum';
    }

    if (diffMinutes < 60) {
        return `Acum ${diffMinutes} minute`;
    }

    const diffHours = Math.round(diffMinutes / 60);

    if (diffHours < 24) {
        return `Acum ${diffHours} ore`;
    }

    const diffDays = Math.round(diffHours / 24);

    if (diffDays === 1) {
        return 'Ieri';
    }

    if (diffDays < 7) {
        return `Acum ${diffDays} zile`;
    }

    return `Acum ${Math.round(diffDays / 7)} saptamani`;
}

Notifications.layout = (page) => <AppLayout>{page}</AppLayout>;

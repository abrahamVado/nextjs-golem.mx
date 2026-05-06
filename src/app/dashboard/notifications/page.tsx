'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardNotice, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { notificationApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/errors';

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    type: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [endpointUnavailable, setEndpointUnavailable] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getAll();
            setEndpointUnavailable(false);
            setErrorMessage(null);
            setNotifications(res.data.data || []);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setEndpointUnavailable(true);
                setNotifications([]);
                setErrorMessage(null);
            } else {
                setErrorMessage(getErrorMessage(error, 'Failed to fetch notifications.'));
                console.error('Failed to fetch notifications', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await notificationApi.markRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    if (loading) return <div className="p-8">Loading notifications...</div>;

    return (
        <DashboardCanvas>
            <DashboardContent>
            <DashboardHero
                eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Notifications</>}
                title="Notifications inside the shared dashboard atmosphere"
                description="Track system and activity updates in one place with the same hero, glass surfaces, and calm control-room palette."
                right={
                    notifications.some(n => !n.is_read) ? (
                        <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                            <Button onClick={markAllAsRead} variant="secondary">
                                Mark all as read
                            </Button>
                        </DashboardSurface>
                    ) : null
                }
            />

            {endpointUnavailable ? (
                <DashboardSurface>
                    <DashboardNotice
                        title="Notifications are not enabled in this backend yet"
                        description="The dashboard is ready for notifications, but the current API does not expose the route yet. Once the backend endpoint is added, items will appear here automatically."
                    />
                </DashboardSurface>
            ) : null}

            {errorMessage ? (
                <DashboardSurface>
                    <DashboardNotice
                        title="We couldn't load notifications"
                        description={errorMessage}
                    />
                </DashboardSurface>
            ) : null}

            {!endpointUnavailable && !errorMessage && notifications.length === 0 ? (
                <DashboardSurface>
                    <DashboardEmpty title="You have no notifications." description="System and activity updates will appear here once events begin flowing into your account." />
                </DashboardSurface>
            ) : !endpointUnavailable && !errorMessage ? (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <DashboardSurface
                            key={notification.id}
                            className={`rounded-[22px] p-4 transition-colors ${notification.is_read
                                ? 'bg-white/85 border-slate-200'
                                : 'bg-blue-50/85 border-blue-200'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`text-sm font-semibold ${notification.is_read ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm">
                                        {notification.message}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-400">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {!notification.is_read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        </DashboardSurface>
                    ))}
                </div>
            ) : null}
            </DashboardContent>
        </DashboardCanvas>
    );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardNotice, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/components/providers/language-provider';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/lib/api';

type MePayload = {
    user_id: string;
    company_id: string;
    branch_id?: string | null;
};

export default function SettingsPage() {
    const { __ } = useLanguage();
    const { user } = useAuth();
    const [me, setMe] = useState<MePayload | null>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        let active = true;

        const loadProfile = async () => {
            setLoading(true);
            setMessage(null);
            try {
                const response = await userApi.getMe();
                if (!active) return;
                const nextMe = response.data.data;
                setMe(nextMe);
                setName(user?.name && user.name !== nextMe.user_id ? user.name : '');
            } catch (error: unknown) {
                if (!active) return;
                setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to load /me.') });
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadProfile();
        return () => {
            active = false;
        };
    }, [user?.name]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await userApi.updateMe({ name: name.trim() });
            setName(name.trim());
            setMessage({ type: 'success', text: __('settings.profile_updated') });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to update /me.') });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Settings</>}
                    title={__('settings.title')}
                    description="Settings now use the same visual system as the access area while reflecting the live Go backend contract for GET /me and PATCH /me."
                />

            {message ? (
                <DashboardNotice tone={message.type === 'success' ? 'emerald' : 'red'}>
                    {message.text}
                </DashboardNotice>
            ) : null}

            <DashboardSurface>
                <h2 className="text-lg font-semibold text-gray-900">{__('settings.personal_info')}</h2>
                <p className="mt-2 text-sm text-gray-600">
                    The current backend returns identity IDs from <code>/me</code> and accepts only a <code>name</code> field on <code>PATCH /me</code>.
                </p>

                {loading ? (
                    <div className="mt-6 text-sm text-gray-500">Loading profile...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">User ID</div>
                                <div className="mt-2 break-all text-sm text-gray-900">{me?.user_id || 'Unavailable'}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company ID</div>
                                <div className="mt-2 break-all text-sm text-gray-900">{me?.company_id || 'Unavailable'}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Branch ID</div>
                                <div className="mt-2 break-all text-sm text-gray-900">{me?.branch_id || 'None'}</div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-900">{__('settings.full_name')}</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name for PATCH /me"
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Email, avatar uploads, linked accounts, and password changes stay hidden until the Go backend exposes matching endpoints.
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" isLoading={saving}>
                                {__('common.save_changes')}
                            </Button>
                        </div>
                    </form>
                )}
            </DashboardSurface>
            </DashboardContent>
        </DashboardCanvas>
    );
}

'use client';

import Image from 'next/image';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardNotice, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/components/providers/language-provider';
import { getErrorMessage } from '@/lib/errors';
import { resolveAssetURL } from '@/lib/assets';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/lib/api';

type MePayload = {
    user_id: string;
    company_id: string;
    branch_id?: string | null;
    name?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
};

export default function SettingsPage() {
    const { __ } = useLanguage();
    const { user, checkAuth } = useAuth();
    const [me, setMe] = useState<MePayload | null>(null);
    const [name, setName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
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
                setName(nextMe.name || '');
            } catch (error: unknown) {
                if (!active) return;
                setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to load profile.') });
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadProfile();
        return () => {
            active = false;
        };
    }, []);

    const refreshMe = async () => {
        const response = await userApi.getMe();
        const nextMe = response.data.data;
        setMe(nextMe);
        setName(nextMe.name || '');
        await checkAuth();
    };

    const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSavingProfile(true);
        setMessage(null);
        try {
            const response = await userApi.updateMe({ name: name.trim() });
            setMe(response.data.data);
            await checkAuth();
            setMessage({ type: 'success', text: __('settings.profile_updated') });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to update profile.') });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSavingPassword(true);
        setMessage(null);
        try {
            await userApi.changePassword({ old_password: oldPassword, new_password: newPassword });
            setOldPassword('');
            setNewPassword('');
            setMessage({ type: 'success', text: 'Password updated successfully.' });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to update password.') });
        } finally {
            setSavingPassword(false);
        }
    };

    const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSavingAvatar(true);
        setMessage(null);
        try {
            await userApi.uploadAvatar(file);
            await refreshMe();
            setMessage({ type: 'success', text: 'Avatar updated successfully.' });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, __('settings.avatar_upload_error')) });
        } finally {
            setSavingAvatar(false);
            event.target.value = '';
        }
    };

    const avatarSrc = resolveAssetURL(me?.avatar_url || user?.avatar_url);
    const displayName = me?.name || user?.name || 'User';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Settings</>}
                    title={__('settings.title')}
                    description="Every authenticated user can update their username, password, and avatar here."
                />

                {message ? (
                    <DashboardNotice tone={message.type === 'success' ? 'emerald' : 'red'}>
                        {message.text}
                    </DashboardNotice>
                ) : null}

                {loading ? (
                    <DashboardSurface>
                        <div className="text-sm text-gray-500">Loading profile...</div>
                    </DashboardSurface>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
                        <DashboardSurface className="space-y-5">
                            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                            <div className="flex items-center gap-4">
                                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-semibold text-slate-700">
                                    {avatarSrc ? (
                                        <Image src={avatarSrc} alt="Avatar" fill className="object-cover" sizes="80px" unoptimized />
                                    ) : (
                                        <span>{initials || 'U'}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-slate-900">{displayName}</div>
                                    <div className="truncate text-sm text-slate-500">{me?.email || user?.email || 'No email available'}</div>
                                    <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{me?.role || user?.role || 'User'}</div>
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900">Avatar</label>
                                <Input type="file" accept="image/*" onChange={handleAvatarChange} disabled={savingAvatar} />
                                <p className="mt-2 text-xs text-gray-500">Upload a profile image up to 2 MB.</p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl bg-gray-50 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">User ID</div>
                                    <div className="mt-2 break-all text-sm text-gray-900">{me?.user_id || 'Unavailable'}</div>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company ID</div>
                                    <div className="mt-2 break-all text-sm text-gray-900">{me?.company_id || 'Unavailable'}</div>
                                </div>
                            </div>
                        </DashboardSurface>

                        <div className="space-y-6">
                            <DashboardSurface>
                                <h2 className="text-lg font-semibold text-gray-900">{__('settings.personal_info')}</h2>
                                <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-900">{__('settings.full_name')}</label>
                                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Username" required />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" isLoading={savingProfile}>
                                            {__('common.save_changes')}
                                        </Button>
                                    </div>
                                </form>
                            </DashboardSurface>

                            <DashboardSurface>
                                <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                                <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-900">Current password</label>
                                        <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-900">New password</label>
                                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                        <p className="mt-2 text-xs text-gray-500">Use at least 8 characters with uppercase, lowercase, and a number.</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" isLoading={savingPassword}>
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </DashboardSurface>
                        </div>
                    </div>
                )}
            </DashboardContent>
        </DashboardCanvas>
    );
}

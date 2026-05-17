'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardNotice, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/components/providers/language-provider';
import { getErrorMessage } from '@/lib/errors';
import { resolveAssetURL } from '@/lib/assets';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, userApi } from '@/lib/api';
import { hasApiAdminAccess } from '@/lib/access';

type MePayload = {
    user_id: string;
    company_id: string;
    branch_id?: string | null;
    name?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
    account_type?: string;
    is_premium?: boolean;
    is_blocked?: boolean;
    premium_days_remaining?: number;
    free_days_remaining?: number;
    premium_expires_at?: string | null;
    free_expires_at?: string | null;
    blocked_at?: string | null;
};

function formatAccountLabel(value?: string) {
    switch (value) {
        case 'owner':
            return 'Owner';
        case 'founder':
            return 'Founder';
        case 'premium_client':
            return 'Premium Client';
        case 'invalid_client':
            return 'Invalid Client';
        default:
            return 'Free Client';
    }
}

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
    const accountLabel = formatAccountLabel(me?.account_type || user?.account_type);
    const premiumDays = me?.premium_days_remaining ?? user?.premium_days_remaining ?? 0;
    const freeDays = me?.free_days_remaining ?? user?.free_days_remaining ?? 0;
    const isPremium = Boolean(me?.is_premium ?? user?.is_premium);
    const isBlocked = Boolean(me?.is_blocked ?? user?.is_blocked);
    const canManageApi = hasApiAdminAccess(user);
    const docsURL = (() => {
        try {
            return `${new URL(API_BASE_URL).origin}/api/docs`;
        } catch {
            return '/api/docs';
        }
    })();
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
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Account plan</div>
                                        <div className="mt-2 text-xl font-semibold text-slate-950">{accountLabel}</div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {isBlocked
                                                ? 'This account is blocked because the premium and grace periods ended.'
                                                : isPremium
                                                    ? 'Premium actions are enabled for this account.'
                                                    : 'This account is in free access mode and premium actions are locked.'}
                                        </p>
                                    </div>
                                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isBlocked ? 'bg-red-100 text-red-700' : isPremium ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {isBlocked ? 'Blocked' : isPremium ? 'Premium active' : 'Free mode'}
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Premium days</div>
                                        <div className="mt-1 text-2xl font-semibold text-slate-900">{premiumDays || (accountLabel === 'Owner' || accountLabel === 'Founder' ? '∞' : 0)}</div>
                                        <div className="mt-1 text-xs text-slate-500">Available before free mode starts</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Free days</div>
                                        <div className="mt-1 text-2xl font-semibold text-slate-900">{freeDays || (accountLabel === 'Owner' || accountLabel === 'Founder' ? '∞' : 0)}</div>
                                        <div className="mt-1 text-xs text-slate-500">Grace days after premium access ends</div>
                                    </div>
                                </div>
                            </div>
                        </DashboardSurface>

                        <div className="space-y-6">
                            <DashboardSurface>
                                <h2 className="text-lg font-semibold text-gray-900">Premium actions</h2>
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-sm font-semibold text-slate-950">Create companies</div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Company creation is reserved for premium accounts. The backend multi-company flow is the next step, and this card keeps the action in the current dashboard style.
                                        </p>
                                        <button
                                            type="button"
                                            disabled={!isPremium}
                                            className={`mt-4 inline-flex rounded-2xl px-4 py-2 text-sm font-semibold transition ${isPremium ? 'bg-slate-950 text-white hover:bg-slate-800' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                                        >
                                            {isPremium ? 'Premium company creation enabled' : 'Premium required'}
                                        </button>
                                    </div>
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-sm font-semibold text-slate-950">Premium-only actions</div>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                            <li>Create roles</li>
                                            <li>Create companies</li>
                                            <li>Create teams and projects</li>
                                            <li>Print reports</li>
                                        </ul>
                                    </div>
                                </div>
                            </DashboardSurface>

                            <DashboardSurface>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">API configuration</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Configure tenant API access, generate API keys, and manage request-signing credentials from one place.
                                        </p>
                                    </div>
                                    <Button variant="outline" asChild>
                                        <a href={docsURL} target="_blank" rel="noreferrer">Open API Docs</a>
                                    </Button>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-sm font-semibold text-slate-950">API keys</div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Create an API client, generate a key, and copy the full token once for secure storage.
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button asChild>
                                                <Link href="/dashboard/api/clients">Open API administration</Link>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="text-sm font-semibold text-slate-950">Signing keys</div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Upload an OpenSSH public key, activate it with a signed challenge, and use the private key for signed requests.
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button variant="outline" asChild>
                                                <Link href="/dashboard/api/orchestration">Open orchestration tools</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                    {canManageApi
                                        ? 'The frontend is ready for API key generation and public-key setup. If an action fails, the remaining gap is likely the backend apikey routes.'
                                        : 'API configuration is visible here for reference, but only admin or owner roles can manage API clients and signing credentials.'}
                                </div>
                            </DashboardSurface>

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

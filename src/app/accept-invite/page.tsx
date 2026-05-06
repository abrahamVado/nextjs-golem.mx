'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function AcceptInvitePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const run = async () => {
            if (!token) {
                setError('Invite token is missing.');
                setLoading(false);
                return;
            }
            try {
                const res = await authApi.verifyInvite(token);
                setEmail(res.data.data.email);
                setFullName(res.data.data.full_name || '');
            } catch (err: unknown) {
                setError(getErrorMessage(err, 'Invalid or expired invite token'));
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [token]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await authApi.acceptInvite({ token, full_name: fullName, password });
            setSuccess('Invite accepted. You can now login.');
            setTimeout(() => router.push('/login?invite=accepted'), 1000);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to accept invite'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center p-8">Loading invite...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Accept Admin Invite</h1>
                {email && <p className="text-sm text-gray-600 mb-4">Invited email: {email}</p>}

                {error && <div className="mb-4 rounded-md bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
                {success && <div className="mb-4 rounded-md bg-green-50 text-green-700 p-3 text-sm">{success}</div>}

                {!success && (
                    <form onSubmit={onSubmit} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Full name</label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Confirm password</label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full" isLoading={submitting}>Accept Invite</Button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8">Loading invite...</div>}>
            <AcceptInvitePageContent />
        </Suspense>
    );
}

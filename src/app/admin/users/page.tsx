'use client';

import { useEffect, useState } from 'react';
import api, { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AdminInvite } from '@/types';
import { useFeedback } from '@/components/providers/feedback-provider';

interface User {
    id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const feedback = useFeedback();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [invites, setInvites] = useState<AdminInvite[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteFullName, setInviteFullName] = useState('');
    const [expiresInHours, setExpiresInHours] = useState('48');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchInvites();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to fetch users'));
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async (userId: number) => {
        try {
            await api.post(`/admin/users/${userId}/impersonate`);
            window.location.href = '/dashboard';
        } catch (err: unknown) {
            feedback.error('Impersonation failed: ' + getErrorMessage(err, 'request failed'));
        }
    };

    const fetchInvites = async () => {
        try {
            const res = await adminApi.listInvites();
            setInvites(res.data.data || []);
        } catch (err: unknown) {
            console.error('Failed to fetch invites', err);
        }
    };

    const toggleStatus = async (user: User) => {
        try {
            await api.put(`/admin/users/${user.id}/status`, { is_active: !user.is_active });
            // Refresh list
            fetchUsers();
        } catch (err: unknown) {
            feedback.error(getErrorMessage(err, 'Update failed'));
        }
    };

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteMessage(null);
        try {
            const res = await adminApi.createInvite({
                email: inviteEmail,
                full_name: inviteFullName || undefined,
                expires_in_hours: Number(expiresInHours || 48),
            });
            await fetchInvites();
            setInviteEmail('');
            setInviteFullName('');
            setExpiresInHours('48');
            if (res.data.warning) {
                setInviteMessage({ type: 'error', text: res.data.warning });
            } else {
                setInviteMessage({ type: 'success', text: 'Invite sent successfully' });
            }
        } catch (err: unknown) {
            setInviteMessage({ type: 'error', text: getErrorMessage(err, 'Failed to send invite') });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRevokeInvite = async (id: number) => {
        try {
            await adminApi.revokeInvite(id);
            await fetchInvites();
        } catch (err: unknown) {
            feedback.error('Failed to revoke invite: ' + getErrorMessage(err, 'request failed'));
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Users Directory</h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invite Admin</h3>
                <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                        type="email"
                        placeholder="email@domain.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                    />
                    <Input
                        placeholder="Full name (optional)"
                        value={inviteFullName}
                        onChange={(e) => setInviteFullName(e.target.value)}
                    />
                    <Input
                        type="number"
                        min={1}
                        max={168}
                        placeholder="Expires (hours)"
                        value={expiresInHours}
                        onChange={(e) => setExpiresInHours(e.target.value)}
                    />
                    <Button type="submit" isLoading={inviteLoading}>Send Invite</Button>
                </form>
                {inviteMessage && (
                    <div className={`mt-3 text-sm ${inviteMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {inviteMessage.text}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Invites</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {invites.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-6 text-center text-sm text-gray-500">No invites yet</td>
                            </tr>
                        ) : invites.map((invite) => (
                            <tr key={invite.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{invite.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{invite.status}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{new Date(invite.expires_at).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {invite.status === 'pending' && (
                                        <button className="text-red-600 hover:text-red-800" onClick={() => handleRevokeInvite(invite.id)}>
                                            Revoke
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.is_superuser ?
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                                        : <span className="text-sm text-gray-500">User</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => toggleStatus(user)} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.is_active ? 'Active' : 'Banned'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleImpersonate(user.id)}
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        Login As
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

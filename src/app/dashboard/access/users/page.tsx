'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Check,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { createBackendUser, deleteBackendUser, getBackendMe, getBackendRoles, getBackendUsers, updateBackendUser } from '@/lib/backend-access';
import { getErrorMessage } from '@/lib/errors';
import { DashboardBadge, DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardModalFrame, DashboardNotice, DashboardSectionHeading, DashboardSurface, DashboardToolbar } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type MeResponse = { user_id: string; company_id: string; branch_id?: string | null };
type RawItem = Record<string, unknown>;

type DisplayUser = {
    id: string;
    name: string;
    email: string;
    status: string;
    role: string;
    department: string;
    joined: string;
    raw: RawItem;
};

function summarizeUser(item: RawItem, index: number): DisplayUser {
    const id = String(item.id ?? item.user_id ?? `user-${index + 1}`);
    const name = String(item.name ?? item.full_name ?? item.email ?? `User ${index + 1}`);
    const email = typeof item.email === 'string' ? item.email : 'No email exposed';
    const status = String(item.status ?? 'inactive').toLowerCase();
    const role = String(item.role ?? item.role_name ?? item.type ?? 'member').toLowerCase();
    const department = String(item.department ?? item.team ?? item.module ?? 'Workspace');
    const joined = String(item.created_at ?? item.joined ?? item.updated_at ?? '');
    return { id, name, email, status, role, department, joined, raw: item };
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map((part) => part[0]).join('') || 'U').toUpperCase();
}

function formatDate(value: string) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function roleTone(role: string) {
    if (role.includes('admin')) return 'bg-red-100 text-red-700';
    if (role.includes('manager')) return 'bg-amber-100 text-amber-800';
    if (role.includes('viewer')) return 'bg-blue-100 text-blue-700';
    return 'bg-emerald-100 text-emerald-700';
}

export default function UsersPage() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [usersInfo, setUsersInfo] = useState<{ company_id: string; module: string; items: RawItem[] } | null>(null);
    const [rolesInfo, setRolesInfo] = useState<{ company_id: string; module: string; items: RawItem[] } | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<DisplayUser | null>(null);
    const [deletingUser, setDeletingUser] = useState<DisplayUser | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [form, setForm] = useState({ email: '', name: '', password: '', status: 'active', roleIds: [] as string[] });

    const users = useMemo(() => (usersInfo?.items || []).map(summarizeUser), [usersInfo]);
    const availableRoles = useMemo(
        () => (rolesInfo?.items || []).map((item, index) => ({ id: String(item.id ?? `role-${index + 1}`), name: String(item.name ?? `Role ${index + 1}`) })),
        [rolesInfo]
    );

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return users.filter((user) => {
            const haystack = [user.name, user.email, user.role, user.status, user.department, JSON.stringify(user.raw)].join(' ').toLowerCase();
            const matchesSearch = !query || haystack.includes(query);
            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [roleFilter, search, statusFilter, users]);

    const stats = useMemo(
        () => ({
            total: users.length,
            active: users.filter((user) => user.status === 'active').length,
            inactive: users.filter((user) => user.status !== 'active').length,
            admins: users.filter((user) => user.role.includes('admin')).length,
        }),
        [users]
    );

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 2600);
        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [meRes, usersRes, rolesRes] = await Promise.all([getBackendMe(), getBackendUsers(), getBackendRoles()]);
                if (!active) return;
                setMe(meRes.data.data);
                setUsersInfo(usersRes.data.data);
                setRolesInfo(rolesRes.data.data);
            } catch (err: unknown) {
                if (!active) return;
                setError(getErrorMessage(err, 'Failed to load users from the Go backend.'));
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    const reloadUsers = async () => {
        const [usersRes, rolesRes] = await Promise.all([getBackendUsers(), getBackendRoles()]);
        setUsersInfo(usersRes.data.data);
        setRolesInfo(rolesRes.data.data);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setForm({ email: '', name: '', password: '', status: 'active', roleIds: [] });
        setShowCreateModal(true);
    };

    const openEditModal = (user: DisplayUser) => {
        setEditingUser(user);
        const matchedRoleIds = availableRoles
            .filter((role) => (user.raw.role_names as unknown[] | undefined)?.map(String).includes(role.name))
            .map((role) => role.id);
        setForm({
            email: user.email === 'No email exposed' ? '' : user.email,
            name: user.name,
            password: '',
            status: user.status,
            roleIds: matchedRoleIds,
        });
        setShowCreateModal(true);
    };

    const closeUserModal = () => {
        setShowCreateModal(false);
        setEditingUser(null);
        setForm({ email: '', name: '', password: '', status: 'active', roleIds: [] });
    };

    const handleSaveUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (editingUser) {
                await updateBackendUser(editingUser.id, {
                    email: form.email,
                    name: form.name,
                    status: form.status,
                    role_ids: form.roleIds,
                });
            } else {
                await createBackendUser({
                    email: form.email,
                    name: form.name,
                    password: form.password,
                    status: form.status,
                    role_ids: form.roleIds,
                });
            }
            await reloadUsers();
            closeUserModal();
            setToast({ tone: 'success', message: editingUser ? 'User updated successfully.' : 'User created successfully.' });
        } catch (err: unknown) {
            setToast({ tone: 'error', message: getErrorMessage(err, editingUser ? 'Failed to update user.' : 'Failed to create user.') });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (user: DisplayUser) => {
        const nextStatus = user.status === 'active' ? 'inactive' : 'active';
        setUpdatingStatusId(user.id);
        setError(null);
        try {
            await updateBackendUser(user.id, {
                email: user.email,
                name: user.name,
                status: nextStatus,
                role_ids: availableRoles
                    .filter((role) => (user.raw.role_names as unknown[] | undefined)?.map(String).includes(role.name))
                    .map((role) => role.id),
            });
            await reloadUsers();
            setToast({ tone: 'success', message: `${user.name} is now ${nextStatus}.` });
        } catch (err: unknown) {
            setToast({ tone: 'error', message: getErrorMessage(err, 'Failed to update user status.') });
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        try {
            await deleteBackendUser(deletingUser.id);
            await reloadUsers();
            setToast({ tone: 'success', message: `${deletingUser.name} was deleted.` });
            setDeletingUser(null);
        } catch (err: unknown) {
            setToast({ tone: 'error', message: getErrorMessage(err, 'Failed to delete user.') });
        }
    };

    if (loading) {
        return <div className="p-6 text-sm text-slate-600">Loading users...</div>;
    }

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Access / Users</>}
                    title="User management that feels like a real control room"
                    description="Review workspace people, filter access signals, and create users from a richer operating surface while staying grounded in the current backend contract."
                    right={
                        <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">System health</div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">User feed</span>
                                    <span className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Live
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Operator</span>
                                    <span className="text-xs font-extrabold text-slate-600">{me?.user_id?.slice(0, 8) || 'n/a'}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Tenant</span>
                                    <span className="text-xs font-extrabold text-slate-600">{usersInfo?.company_id?.slice(0, 8) || 'n/a'}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Total users</span>
                                    <span className="text-xs font-extrabold text-slate-600">{stats.total}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Active users</span>
                                    <span className="text-xs font-extrabold text-emerald-700">{stats.active}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Inactive users</span>
                                    <span className="text-xs font-extrabold text-amber-700">{stats.inactive}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Admins</span>
                                    <span className="text-xs font-extrabold text-violet-700">{stats.admins}</span>
                                </div>
                            </div>
                        </DashboardSurface>
                    }
                />

                <DashboardToolbar>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[260px] flex-1">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search names, emails, roles, departments, or payload fields"
                                className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_5px_rgba(16,185,129,0.12)]"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value)}
                            className="min-h-11 rounded-2xl border border-slate-300 bg-white/90 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                        >
                            <option value="">All roles</option>
                            {[...new Set(users.map((user) => user.role))].map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="min-h-11 rounded-2xl border border-slate-300 bg-white/90 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <DashboardBadge>
                            {filteredUsers.length} {filteredUsers.length === 1 ? 'result' : 'results'}
                        </DashboardBadge>
                        <Button className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={openCreateModal}>
                            <Plus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>
                </DashboardToolbar>

                {error ? (
                    <DashboardNotice>{error}</DashboardNotice>
                ) : null}

                <DashboardSurface className="overflow-hidden rounded-[28px] p-0 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                    <DashboardSectionHeading
                        title="Workspace people"
                        description="A cleaner, more operational table generated from live backend user records."
                        action={<DashboardBadge>Module: {usersInfo?.module || 'users'}</DashboardBadge>}
                    />

                    {filteredUsers.length === 0 ? (
                        <DashboardEmpty
                            title="No users found"
                            description="Try changing the search text or filters. The live payload may also be sparse in the current backend instance."
                        />
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="min-w-[920px] w-full border-collapse">
                                    <thead className="bg-slate-50/80">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">User</th>
                                            <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Role</th>
                                            <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Status</th>
                                            <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Department</th>
                                            <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Joined</th>
                                            <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-t border-slate-200 transition hover:bg-emerald-50/30">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.42),transparent_28%),linear-gradient(135deg,#2563eb,#10b981)] text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(37,99,235,0.18)]">
                                                            {getInitials(user.name)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-extrabold text-slate-950">{user.name}</div>
                                                            <div className="text-sm text-slate-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize', roleTone(user.role))}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn(
                                                            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold capitalize',
                                                            user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                                        )}>
                                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                            {user.status}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={updatingStatusId === user.id}
                                                            onClick={() => handleToggleStatus(user)}
                                                            className={cn(
                                                                'relative h-7 w-12 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60',
                                                                user.status === 'active' ? 'bg-emerald-500 shadow-[0_8px_16px_rgba(16,185,129,0.22)]' : 'bg-slate-300'
                                                            )}
                                                            aria-label={`Toggle status for ${user.name}`}
                                                        >
                                                            <span className={cn(
                                                                'absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-md transition',
                                                                user.status === 'active' && 'translate-x-[22px]'
                                                            )} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-500">{user.department}</td>
                                                <td className="px-5 py-4 text-sm text-slate-500">{formatDate(user.joined)}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(user)}
                                                            className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-extrabold text-blue-700 transition hover:bg-blue-200"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingUser(user)}
                                                            className="rounded-xl bg-red-100 px-3 py-2 text-xs font-extrabold text-red-700 transition hover:bg-red-200"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid gap-4 p-4 lg:hidden">
                                {filteredUsers.map((user) => (
                                    <article key={user.id} className="rounded-[20px] border border-slate-200 bg-white/85 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.42),transparent_28%),linear-gradient(135deg,#2563eb,#10b981)] text-sm font-extrabold text-white">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-extrabold text-slate-950">{user.name}</div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={updatingStatusId === user.id}
                                                onClick={() => handleToggleStatus(user)}
                                                className={cn(
                                                    'relative h-7 w-12 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60',
                                                    user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                                                )}
                                            >
                                                <span className={cn(
                                                    'absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-md transition',
                                                    user.status === 'active' && 'translate-x-[22px]'
                                                )} />
                                            </button>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-slate-50 p-3">
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Role</div>
                                                <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-extrabold capitalize', roleTone(user.role))}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-3">
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Status</div>
                                                <span className={cn(
                                                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold capitalize',
                                                    user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                                )}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {user.status}
                                                </span>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-3">
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Department</div>
                                                <div className="text-sm font-semibold text-slate-700">{user.department}</div>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-3">
                                                <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Joined</div>
                                                <div className="text-sm font-semibold text-slate-700">{formatDate(user.joined)}</div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button type="button" onClick={() => openEditModal(user)} className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-extrabold text-blue-700">
                                                Edit
                                            </button>
                                            <button type="button" onClick={() => setDeletingUser(user)} className="rounded-xl bg-red-100 px-3 py-2 text-xs font-extrabold text-red-700">
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </DashboardSurface>

                <DashboardSurface>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-950">Implementation notes</h3>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                                This page now mirrors the richer HTML mock’s structure and feel, with real backend persistence for create, edit, delete, and status changes inside the Go users module.
                            </p>
                        </div>
                        <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700">New view active</div>
                    </div>
                    <pre className="mt-5 max-h-[280px] overflow-auto rounded-[18px] bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
                        {JSON.stringify(filteredUsers.map((user) => user.raw), null, 2)}
                    </pre>
                </DashboardSurface>
            </DashboardContent>

            {showCreateModal ? (
                <DashboardModalFrame width="max-w-[560px]">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                                <p className="mt-1 text-sm text-slate-500">{editingUser ? 'Update user details, role assignment, and status.' : 'Create a user account with the live Go backend.'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeUserModal}
                                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-5 px-6 py-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 flex items-center justify-between text-sm font-extrabold text-slate-900">
                                        Full name
                                        <span className="text-xs font-semibold text-slate-500">Required</span>
                                    </label>
                                    <input
                                        value={form.name}
                                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                        className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_5px_rgba(16,185,129,0.12)]"
                                        placeholder="Jane Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 flex items-center justify-between text-sm font-extrabold text-slate-900">
                                        Email
                                        <span className="text-xs font-semibold text-slate-500">Required</span>
                                    </label>
                                    <input
                                        value={form.email}
                                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                        className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_5px_rgba(16,185,129,0.12)]"
                                        placeholder="jane@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 flex items-center justify-between text-sm font-extrabold text-slate-900">
                                        Temporary password
                                        <span className="text-xs font-semibold text-slate-500">Required</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                        className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_5px_rgba(16,185,129,0.12)]"
                                        placeholder={editingUser ? 'Leave unused for existing account' : 'Minimum 8 characters'}
                                        required={!editingUser}
                                        disabled={!!editingUser}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 text-sm font-extrabold text-slate-900">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                                        className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 flex items-center justify-between text-sm font-extrabold text-slate-900">
                                    Assign roles
                                    <span className="text-xs font-semibold text-slate-500">{availableRoles.length} available</span>
                                </label>
                                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {availableRoles.length === 0 ? (
                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">No roles available</span>
                                        ) : null}
                                        {availableRoles.map((role) => {
                                            const active = form.roleIds.includes(role.id);
                                            return (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            roleIds: active ? current.roleIds.filter((id) => id !== role.id) : [...current.roleIds, role.id],
                                                        }))
                                                    }
                                                    className={cn(
                                                        'rounded-full border px-3 py-1.5 text-xs font-extrabold transition',
                                                        active ? 'border-emerald-300 bg-emerald-100 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'
                                                    )}
                                                >
                                                    {role.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={closeUserModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
                                    <Plus className="h-4 w-4" />
                                    {editingUser ? 'Update User' : 'Save User'}
                                </Button>
                            </div>
                        </form>
                </DashboardModalFrame>
            ) : null}

            {deletingUser ? (
                <DashboardModalFrame width="max-w-[430px]">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Delete {deletingUser.name}?</h2>
                            <p className="mt-1 text-sm text-slate-500">This will remove the user from the current tenant-scoped list.</p>
                        </div>
                        <div className="space-y-5 px-6 py-6">
                            <div className="flex gap-3 rounded-[20px] bg-red-50 p-4 text-sm text-red-800">
                                <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
                                <div>
                                    <div className="font-semibold text-slate-900">This action can affect access immediately.</div>
                                    <div className="mt-1">The backend will mark the user deleted and clear active role assignments for this company.</div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setDeletingUser(null)}>
                                    Cancel
                                </Button>
                                <Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteUser}>
                                    Delete User
                                </Button>
                            </div>
                        </div>
                </DashboardModalFrame>
            ) : null}

            {toast ? (
                <div className="pointer-events-none fixed bottom-6 right-6 z-[60]">
                    <div className={cn(
                        'flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)]',
                        toast.tone === 'success' ? 'bg-emerald-600' : 'bg-slate-900'
                    )}>
                        <div className="mt-0.5">
                            {toast.tone === 'success' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <span>{toast.message}</span>
                    </div>
                </div>
            ) : null}
        </DashboardCanvas>
    );
}

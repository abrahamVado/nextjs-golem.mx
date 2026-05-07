'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Minus, Pencil, Plus, ShieldPlus, Trash2, X } from 'lucide-react';
import { createBackendPermission, createBackendRole, deleteBackendRole, getBackendPermissions, getBackendRolePermissions, getBackendRoles, updateBackendRole } from '@/lib/backend-access';
import { DashboardBadge, DashboardCanvas, DashboardContent, DashboardModalFrame, DashboardNotice, DashboardStatCard, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type RawRecord = Record<string, unknown>;

type PermissionModule = {
    id: string;
    name: string;
    permissions: string[];
};

type PermissionRecord = {
    id: string;
    name: string;
    moduleId: string;
};

type MatrixRole = {
    id: string;
    name: string;
    color: string;
    dotClass: string;
    persisted: boolean;
    sourceStatus: string;
    permissionIds: string[];
    perms: Record<string, number[]>;
    raw: RawRecord;
};

const ROLE_COLORS = ['#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899'];

const ROLE_PRESETS = [
    { match: 'admin', className: 'bg-red-500' },
    { match: 'manager', className: 'bg-amber-500' },
    { match: 'member', className: 'bg-emerald-500' },
    { match: 'stakeholder', className: 'bg-violet-500' },
];

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function titleize(value: string) {
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferModuleFromPermissionName(name: string) {
    const [first] = name.split(/[.:/_-]/);
    const normalized = slugify(first || 'general');
    return normalized || 'general';
}

function getPermissionLabel(item: RawRecord, fallback: string) {
    const description = String(item.description ?? '').trim();
    if (description) return description;
    return fallback;
}

function summarizeModuleName(id: string) {
    const labels: Record<string, string> = {
        dashboard: 'Dashboard',
        tasks: 'Tasks',
        files: 'Files',
        roles: 'Roles',
        permissions: 'Permissions',
        users: 'Users',
        general: 'General',
    };
    return labels[id] || titleize(id);
}

function pickRoleColor(index: number) {
    return ROLE_COLORS[index % ROLE_COLORS.length];
}

function pickRoleDotClass(name: string) {
    const lowered = name.toLowerCase();
    const match = ROLE_PRESETS.find((item) => lowered.includes(item.match));
    return match?.className || 'bg-cyan-500';
}

function buildModules(items: RawRecord[]) {
    const bucket = new Map<string, Set<string>>();

    items.forEach((item, index) => {
        const permissionName = String(item.name ?? item.code ?? item.permission ?? `Permission ${index + 1}`);
        const permissionLabel = getPermissionLabel(item, permissionName);
        const moduleId = slugify(String(item.module ?? inferModuleFromPermissionName(permissionName)));
        const current = bucket.get(moduleId) || new Set<string>();
        current.add(permissionLabel);
        bucket.set(moduleId, current);
    });

    const modules = Array.from(bucket.entries()).map(([id, names]) => ({
        id,
        name: summarizeModuleName(id),
        permissions: Array.from(names),
    }));

    if (modules.length > 0) return modules;

    return [
        { id: 'dashboard', name: 'Dashboard', permissions: ['View Dashboard', 'Export Data'] },
        { id: 'tasks', name: 'Tasks', permissions: ['View Tasks', 'Create/Edit Tasks', 'Delete Tasks'] },
        { id: 'files', name: 'Files', permissions: ['View Files', 'Upload Files', 'Download Files'] },
    ];
}

function buildPermissionRecords(items: RawRecord[]) {
    return items.map((item, index) => {
        const name = String(item.name ?? item.code ?? item.permission ?? `Permission ${index + 1}`);
        const label = getPermissionLabel(item, name);
        const moduleId = slugify(String(item.module ?? inferModuleFromPermissionName(name)));
        return {
            id: String(item.id ?? `permission-${index + 1}`),
            name: label,
            moduleId,
        } satisfies PermissionRecord;
    });
}

function collectRolePermissionNames(item: RawRecord) {
    const direct = item.permission_names;
    if (Array.isArray(direct)) {
        return direct.map((value) => String(value));
    }

    const roleNames = item.role_names;
    if (Array.isArray(roleNames)) {
        return roleNames.map((value) => String(value));
    }

    return [];
}

function buildRoleMatrix(
    items: RawRecord[],
    modules: PermissionModule[],
    rolePermissionIds: Record<string, string[]>,
    permissionLookupByModule: Record<string, Map<string, PermissionRecord>>
) {
    return items.map((item, index) => {
        const name = String(item.name ?? item.role ?? `Role ${index + 1}`);
        const id = String(item.id ?? `role-${index + 1}`);
        const grantedIds = new Set((rolePermissionIds[id] || []).map((value) => value.toLowerCase()));
        const grantedNames = new Set(collectRolePermissionNames(item).map((value) => value.toLowerCase()));
        const perms: Record<string, number[]> = {};

        modules.forEach((module) => {
            perms[module.id] = module.permissions.map((permission) => {
                const permissionRecord = permissionLookupByModule[module.id]?.get(permission.toLowerCase());
                if (permissionRecord && grantedIds.has(permissionRecord.id.toLowerCase())) {
                    return 1;
                }
                if (grantedIds.size === 0 && grantedNames.size === 0) {
                    return index === 0 ? 1 : 0;
                }
                return grantedNames.has(permission.toLowerCase()) ? 1 : 0;
            });
        });

        return {
            id,
            name,
            color: String(item.color ?? pickRoleColor(index)),
            dotClass: pickRoleDotClass(name),
            persisted: true,
            sourceStatus: String(item.status ?? 'active'),
            permissionIds: rolePermissionIds[id] || [],
            perms,
            raw: item,
        } satisfies MatrixRole;
    });
}

export default function RolesPage() {
    const [rolesInfo, setRolesInfo] = useState<{ company_id: string; module: string; items: RawRecord[] } | null>(null);
    const [permissionsInfo, setPermissionsInfo] = useState<{ company_id: string; module: string; items: RawRecord[] } | null>(null);
    const [roles, setRoles] = useState<MatrixRole[]>([]);
    const [modules, setModules] = useState<PermissionModule[]>([]);
    const [permissionRecords, setPermissionRecords] = useState<PermissionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showPermModal, setShowPermModal] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [savingRole, setSavingRole] = useState(false);
    const [savingPermission, setSavingPermission] = useState(false);
    const [roleForm, setRoleForm] = useState({ id: '', name: '', color: ROLE_COLORS[0], mode: 'create' as 'create' | 'edit' });
    const [permissionName, setPermissionName] = useState('');
    const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

    const stats = useMemo(() => {
        const permissionCount = modules.reduce((total, module) => total + module.permissions.length, 0);
        return {
            roleCount: roles.length,
            permissionCount,
            moduleCount: modules.length,
        };
    }, [modules, roles]);

    const rawPayload = useMemo(
        () => ({
            roles: rolesInfo?.items || [],
            permissions: permissionsInfo?.items || [],
        }),
        [permissionsInfo, rolesInfo]
    );

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 2200);
        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [rolesRes, permissionsRes] = await Promise.all([getBackendRoles(), getBackendPermissions()]);
                if (!active) return;

                const nextRolesInfo = rolesRes.data.data;
                const nextPermissionsInfo = permissionsRes.data.data;
                const nextPermissionRecords = buildPermissionRecords(nextPermissionsInfo.items || []);
                const nextModules = buildModules(nextPermissionsInfo.items || []);
                const permissionLookupByModule = nextPermissionRecords.reduce<Record<string, Map<string, PermissionRecord>>>((acc, record) => {
                    if (!acc[record.moduleId]) acc[record.moduleId] = new Map<string, PermissionRecord>();
                    acc[record.moduleId].set(record.name.toLowerCase(), record);
                    return acc;
                }, {});
                const rolePermissionPairs = await Promise.all(
                    (nextRolesInfo.items || []).map(async (item, index) => {
                        const roleId = String(item.id ?? `role-${index + 1}`);
                        try {
                            const response = await getBackendRolePermissions(roleId);
                            const ids = (response.data.data.items || []).map((permission) => String(permission.id));
                            return [roleId, ids] as const;
                        } catch {
                            return [roleId, []] as const;
                        }
                    })
                );
                const rolePermissionIds = Object.fromEntries(rolePermissionPairs);
                const nextRoles = buildRoleMatrix(nextRolesInfo.items || [], nextModules, rolePermissionIds, permissionLookupByModule);
                const nextCollapsedModules = Object.fromEntries(nextModules.map((module) => [module.id, true]));

                setRolesInfo(nextRolesInfo);
                setPermissionsInfo(nextPermissionsInfo);
                setModules(nextModules);
                setPermissionRecords(nextPermissionRecords);
                setRoles(nextRoles);
                setCollapsedModules(nextCollapsedModules);
            } catch (err: unknown) {
                if (!active) return;
                setError(getErrorMessage(err, 'Failed to load roles and permissions from the Go backend.'));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, []);

    const openPermissionModal = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setPermissionName('');
        setShowPermModal(true);
    };

    const toggleModuleCollapse = (moduleId: string) => {
        setCollapsedModules((current) => ({
            ...current,
            [moduleId]: !current[moduleId],
        }));
    };

    const togglePermission = async (roleIndex: number, moduleId: string, permIndex: number) => {
        const role = roles[roleIndex];
        const permissionName = modules.find((item) => item.id === moduleId)?.permissions[permIndex];
        const permissionRecord = permissionRecords.find((item) => item.moduleId === moduleId && item.name === permissionName);
        if (!role || !permissionName || !permissionRecord) {
            setToast('This permission is not backed by a persisted record yet');
            return;
        }

        const previousRoles = roles;
        const previousRole = role;
        const currentIds = new Set(role.permissionIds);
        if (currentIds.has(permissionRecord.id)) currentIds.delete(permissionRecord.id);
        else currentIds.add(permissionRecord.id);
        const nextPermissionIds = Array.from(currentIds);

        const nextRoles = roles.map((currentRole, index) => {
            if (index !== roleIndex) return currentRole;
            const nextValues = [...(currentRole.perms[moduleId] || [])];
            nextValues[permIndex] = nextValues[permIndex] ? 0 : 1;
            return {
                ...currentRole,
                permissionIds: nextPermissionIds,
                perms: {
                    ...currentRole.perms,
                    [moduleId]: nextValues,
                },
            };
        });

        setRoles(nextRoles);
        setUpdatingRoleId(role.id);
        setError(null);
        try {
            await updateBackendRole(role.id, { permission_ids: nextPermissionIds });
            setToast('Permission updated');
        } catch (err: unknown) {
            setRoles(previousRoles);
            setError(getErrorMessage(err, `Failed to update permissions for ${previousRole.name}.`));
        } finally {
            setUpdatingRoleId(null);
        }
    };

    const removeRole = async (index: number) => {
        const target = roles[index];
        if (!target) return;

        if (!window.confirm(`Delete role "${target.name}"?`)) return;

        setUpdatingRoleId(target.id);
        setError(null);
        try {
            await deleteBackendRole(target.id);
            setRoles((current) => current.filter((_, currentIndex) => currentIndex !== index));
            setRolesInfo((current) => current ? { ...current, items: current.items.filter((item) => String(item.id) !== target.id) } : current);
            setToast(`Role "${target.name}" deleted`);
        } catch (err: unknown) {
            setError(getErrorMessage(err, `Failed to delete ${target.name}.`));
        } finally {
            setUpdatingRoleId(null);
        }
    };

    const openEditRoleModal = (role: MatrixRole) => {
        setRoleForm({
            id: role.id,
            name: role.name,
            color: role.color,
            mode: 'edit',
        });
        setShowRoleModal(true);
    };

    const openCreateRoleModal = () => {
        setRoleForm({ id: '', name: '', color: ROLE_COLORS[0], mode: 'create' });
        setShowRoleModal(true);
    };

    const addPermission = () => {
        void (async () => {
            const trimmed = permissionName.trim();
            if (!trimmed || !selectedModuleId) {
                setToast('Enter a permission name');
                return;
            }

            setSavingPermission(true);
            setError(null);
            try {
                const canonicalName = `${selectedModuleId}.${slugify(trimmed) || 'custom'}`;
                const response = await createBackendPermission({
                    name: canonicalName,
                    description: trimmed,
                });

                const createdPermission = response.data.data;
                const nextPermissionItem =
                    typeof createdPermission === 'object' && createdPermission
                        ? (createdPermission as RawRecord)
                        : ({ name: canonicalName, description: trimmed } as RawRecord);

                const nextPermissionsItems = [...(permissionsInfo?.items || []), nextPermissionItem];
                const nextPermissionsInfo = permissionsInfo
                    ? { ...permissionsInfo, items: nextPermissionsItems }
                    : {
                          company_id: rolesInfo?.company_id || '',
                          module: 'permissions',
                          items: nextPermissionsItems,
                      };

                const nextPermissionRecords = buildPermissionRecords(nextPermissionsItems);
                const nextModules = buildModules(nextPermissionsItems);
                const permissionLookupByModule = nextPermissionRecords.reduce<Record<string, Map<string, PermissionRecord>>>((acc, record) => {
                    if (!acc[record.moduleId]) acc[record.moduleId] = new Map<string, PermissionRecord>();
                    acc[record.moduleId].set(record.name.toLowerCase(), record);
                    return acc;
                }, {});
                const rolePermissionIds = Object.fromEntries(roles.map((role) => [role.id, role.permissionIds]));
                const nextRoles = buildRoleMatrix(rolesInfo?.items || [], nextModules, rolePermissionIds, permissionLookupByModule);

                setPermissionsInfo(nextPermissionsInfo);
                setPermissionRecords(nextPermissionRecords);
                setModules(nextModules);
                setRoles(nextRoles);
                setShowPermModal(false);
                setPermissionName('');
                setToast(`"${trimmed}" added to ${summarizeModuleName(selectedModuleId)}`);
            } catch (err: unknown) {
                setError(getErrorMessage(err, 'Failed to create permission.'));
            } finally {
                setSavingPermission(false);
            }
        })();
    };

    const removePermission = (moduleId: string, permIndex: number) => {
        const targetModule = modules.find((item) => item.id === moduleId);
        const permissionLabel = targetModule?.permissions[permIndex];
        if (!permissionLabel) return;

        setModules((current) =>
            current.map((item) =>
                item.id === moduleId
                    ? { ...item, permissions: item.permissions.filter((_, index) => index !== permIndex) }
                    : item
            )
        );

        setRoles((current) =>
            current.map((role) => ({
                ...role,
                perms: {
                    ...role.perms,
                    [moduleId]: (role.perms[moduleId] || []).filter((_, index) => index !== permIndex),
                },
            }))
        );

        setToast(`"${permissionLabel}" removed`);
    };

    const handleSaveRole = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = roleForm.name.trim();

        if (!trimmedName) {
            setToast('Please enter a role name');
            return;
        }

        setSavingRole(true);
        try {
            if (roleForm.mode === 'edit' && roleForm.id) {
                const response = await updateBackendRole(roleForm.id, { name: trimmedName });
                const updatedRole = response.data.data;

                setRoles((current) =>
                    current.map((role) =>
                        role.id === roleForm.id
                            ? {
                                  ...role,
                                  name: String(updatedRole.name ?? trimmedName),
                                  color: roleForm.color,
                                  raw: typeof updatedRole === 'object' && updatedRole ? { ...updatedRole, color: roleForm.color } : { ...role.raw, name: trimmedName, color: roleForm.color },
                                  dotClass: pickRoleDotClass(trimmedName),
                              }
                            : role
                    )
                );
                setRolesInfo((current) =>
                    current
                        ? {
                              ...current,
                              items: current.items.map((item) =>
                                  String(item.id) === roleForm.id ? { ...item, name: trimmedName, color: roleForm.color } : item
                              ),
                          }
                        : current
                );
                setToast(`Role "${trimmedName}" updated`);
            } else {
                const response = await createBackendRole({ name: trimmedName });
                const createdRole = response.data.data;

                const newRole: MatrixRole = {
                    id: String(createdRole.id ?? `${slugify(trimmedName) || 'role'}-${Date.now()}`),
                    name: String(createdRole.name ?? trimmedName),
                    color: roleForm.color,
                    dotClass: pickRoleDotClass(trimmedName),
                    persisted: true,
                    sourceStatus: String(createdRole.status ?? 'active'),
                    permissionIds: [],
                    perms: Object.fromEntries(modules.map((module) => [module.id, Array(module.permissions.length).fill(0)])),
                    raw: typeof createdRole === 'object' && createdRole ? { ...createdRole, color: roleForm.color } : { name: trimmedName, color: roleForm.color },
                };

                setRoles((current) => [...current, newRole]);
                setRolesInfo((current) => current ? { ...current, items: [...current.items, newRole.raw] } : current);
                setToast(`Role "${trimmedName}" added`);
            }

            setRoleForm({ id: '', name: '', color: ROLE_COLORS[0], mode: 'create' });
            setShowRoleModal(false);
        } catch (err: unknown) {
            setError(getErrorMessage(err, roleForm.mode === 'edit' ? 'Failed to update role.' : 'Failed to create role.'));
        } finally {
            setSavingRole(false);
        }
    };

    if (isLoading) {
        return <div className="p-6 text-sm text-slate-600">Loading roles...</div>;
    }

    return (
        <DashboardCanvas className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#f8faf9_0%,#f3f7f5_100%)]">
            <DashboardContent className="max-w-[1400px]">
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                            Access / Roles
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Team & Permissions</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                            Control access levels and replace the old roles view with a live permission matrix that still speaks to the current backend contract.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {rolesInfo?.module || 'roles'}
                        </div>
                        <Button
                            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                            onClick={openCreateRoleModal}
                        >
                            <ShieldPlus className="h-4 w-4" />
                            Add Role
                        </Button>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <DashboardStatCard label="Roles" value={stats.roleCount} hint="Active roles visible in this matrix view." />
                    <DashboardStatCard label="Permissions" value={stats.permissionCount} hint="Permission columns grouped into access modules." />
                    <DashboardStatCard label="Tenant" value={rolesInfo?.company_id?.slice(0, 8) || 'n/a'} hint="Current backend company context." />
                </div>

                {error ? (
                    <DashboardNotice className="mb-6">{error}</DashboardNotice>
                ) : null}

                <div className="space-y-8">
                    {modules.map((module) => (
                        <section
                            key={module.id}
                            className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/70 shadow-[0_12px_34px_rgba(15,23,42,0.05)] backdrop-blur"
                        >
                            <div className="flex flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition',
                                            collapsedModules[module.id]
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                : 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800'
                                        )}
                                        onClick={() => toggleModuleCollapse(module.id)}
                                        aria-expanded={!collapsedModules[module.id]}
                                        aria-controls={`module-table-${module.id}`}
                                        aria-label={`${collapsedModules[module.id] ? 'Expand' : 'Collapse'} ${module.name}`}
                                    >
                                        {collapsedModules[module.id] ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                                    </button>
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-950">{module.name}</h2>
                                        <p className="text-sm text-slate-500">
                                            {collapsedModules[module.id]
                                                ? 'Table minimized. Expand to review and edit role permissions.'
                                                : 'Permissions arranged as a role-by-role matrix.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <DashboardBadge className="py-1 text-xs font-semibold">
                                        {roles.length} roles · {module.permissions.length} permissions
                                    </DashboardBadge>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                                        onClick={() => openPermissionModal(module.id)}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Permission
                                    </button>
                                </div>
                            </div>

                            <div
                                id={`module-table-${module.id}`}
                                hidden={!!collapsedModules[module.id]}
                                className="overflow-x-auto border-t border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                            >
                                <table className="min-w-[700px] w-full border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b-2 border-slate-200">
                                            <th className="w-[220px] min-w-[220px] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                Role
                                            </th>
                                            {module.permissions.map((permission, permIndex) => (
                                                <th key={`${module.id}-${permission}`} className="relative px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                    <div className="mx-auto max-w-[140px] text-balance normal-case tracking-normal text-slate-600">
                                                        {permission}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                                                        onClick={() => removePermission(module.id, permIndex)}
                                                        aria-label={`Remove ${permission}`}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roles.map((role, roleIndex) => (
                                            <tr key={role.id} className="group border-b border-slate-200 transition hover:bg-emerald-50/40">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={cn('inline-block h-2.5 w-2.5 rounded-full', role.dotClass)}
                                                                style={{ backgroundColor: role.color }}
                                                            />
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-900">{role.name}</div>
                                                                <div className="mt-1 text-xs text-slate-500">
                                                                    {role.persisted ? role.sourceStatus : 'local matrix state'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                                                            <button
                                                                type="button"
                                                                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                                                onClick={() => openEditRoleModal(role)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                                                                onClick={() => void removeRole(roleIndex)}
                                                                disabled={updatingRoleId === role.id}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                {module.permissions.map((_, permIndex) => {
                                                    const checked = !!role.perms[module.id]?.[permIndex];
                                                    return (
                                                        <td key={`${role.id}-${module.id}-${permIndex}`} className="px-5 py-4 text-center">
                                                            <div className="flex justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePermission(roleIndex, module.id, permIndex)}
                                                                    disabled={updatingRoleId === role.id}
                                                                    className={cn(
                                                                        'flex h-6 w-6 items-center justify-center rounded-md border-2 transition disabled:cursor-not-allowed disabled:opacity-60',
                                                                        checked
                                                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                            : 'border-slate-300 bg-white text-transparent hover:border-emerald-500'
                                                                    )}
                                                                    aria-pressed={checked}
                                                                    aria-label={`${checked ? 'Revoke' : 'Grant'} ${module.permissions[permIndex]} for ${role.name}`}
                                                                >
                                                                    <span className="h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-current" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>

                <DashboardSurface className="mt-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-950">Integration notes</h3>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                                Role creation is persisted through the backend. Matrix toggles and inline permission-column changes are currently local to this view until matching role-permission update endpoints are wired to this interaction model.
                            </p>
                        </div>
                        <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            Replacement view active
                        </div>
                    </div>
                    <pre className="mt-5 max-h-[320px] overflow-auto rounded-[18px] bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
                        {JSON.stringify(rawPayload, null, 2)}
                    </pre>
                </DashboardSurface>
            </DashboardContent>

            {showRoleModal ? (
                <DashboardModalFrame width="max-w-md">
                    <div className="w-full rounded-[20px] bg-white p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-950">{roleForm.mode === 'edit' ? 'Edit Role' : 'Add New Role'}</h2>
                            <p className="mt-1 text-sm text-slate-500">{roleForm.mode === 'edit' ? 'Update the role name shown in this matrix.' : 'Create a new role and add it to this matrix view.'}</p>
                        </div>

                        <form onSubmit={handleSaveRole} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">Role Name</label>
                                <input
                                    value={roleForm.name}
                                    onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="e.g. Content Editor"
                                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {ROLE_COLORS.map((color) => {
                                        const active = roleForm.color === color;
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setRoleForm((current) => ({ ...current, color }))}
                                                className={cn(
                                                    'h-9 w-9 rounded-lg border-4 transition hover:scale-105',
                                                    active ? 'border-slate-900 scale-105' : 'border-transparent'
                                                )}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Pick color ${color}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowRoleModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={savingRole} className="bg-emerald-600 text-white hover:bg-emerald-700">
                                    {roleForm.mode === 'edit' ? 'Save Role' : 'Add Role'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DashboardModalFrame>
            ) : null}

            {showPermModal && selectedModuleId ? (
                <DashboardModalFrame width="max-w-md">
                    <div className="w-full rounded-[20px] bg-white p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-950">Add New Permission</h2>
                            <p className="mt-1 text-sm text-slate-500">Add a new permission column to this module in the current UI session.</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">Module</label>
                                <input
                                    readOnly
                                    value={summarizeModuleName(selectedModuleId)}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">Permission Name</label>
                                <input
                                    value={permissionName}
                                    onChange={(event) => setPermissionName(event.target.value)}
                                    placeholder="e.g. Bulk Edit"
                                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowPermModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="button" isLoading={savingPermission} className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={addPermission}>
                                    Add Permission
                                </Button>
                            </div>
                        </div>
                    </div>
                </DashboardModalFrame>
            ) : null}

            {toast ? (
                <div className="pointer-events-none fixed bottom-8 right-8 z-[60] rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
                    {toast}
                </div>
            ) : null}
        </DashboardCanvas>
    );
}

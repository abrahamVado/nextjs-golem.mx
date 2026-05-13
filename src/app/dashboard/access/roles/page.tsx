'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Plus, ShieldPlus, Trash2, X } from 'lucide-react';
import { createBackendPermission, createBackendRole, deleteBackendRole, getBackendPermissions, getBackendRolePermissions, getBackendRoles, updateBackendRole } from '@/lib/backend-access';
import { DashboardBadge, DashboardCanvas, DashboardContent, DashboardHero, DashboardModalFrame, DashboardNotice, DashboardSurface, DashboardToolbar } from '@/components/layout/dashboard-visuals';
import { getErrorMessage } from '@/lib/errors';
import { ensureGSAP } from '@/lib/gsap';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

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
    description: string;
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
            description: String(item.description ?? '').trim(),
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

function getRoleUserCount(role: MatrixRole) {
    const candidates = [
        role.raw.user_count,
        role.raw.users_count,
        role.raw.member_count,
        role.raw.members_count,
        role.raw.assigned_users_count,
    ];

    for (const value of candidates) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }

    const users = role.raw.users;
    if (Array.isArray(users)) return users.length;

    return 0;
}

function getRolePermissionCount(role: MatrixRole) {
    if (role.permissionIds.length > 0) return role.permissionIds.length;

    return Object.values(role.perms).reduce(
        (total, values) => total + values.filter(Boolean).length,
        0
    );
}

export default function RolesPage() {
    const { user } = useAuth();
    const [showDocumentation, setShowDocumentation] = useState(false);
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
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [savingRole, setSavingRole] = useState(false);
    const [savingPermission, setSavingPermission] = useState(false);
    const [roleForm, setRoleForm] = useState({ id: '', name: '', description: '', color: ROLE_COLORS[0], mode: 'create' as 'create' | 'edit' });
    const [permissionName, setPermissionName] = useState('');
    const drawerOverlayRef = useRef<HTMLButtonElement | null>(null);
    const drawerPanelRef = useRef<HTMLElement | null>(null);
    const previousDrawerRoleIdRef = useRef<string | null>(null);

    const stats = useMemo(() => {
        const permissionCount = modules.reduce((total, module) => total + module.permissions.length, 0);
        return {
            roleCount: roles.length,
            permissionCount,
            moduleCount: modules.length,
        };
    }, [modules, roles]);
    const isPremiumAccount = Boolean(user?.is_premium);

    const selectedRole = useMemo(
        () => roles.find((role) => role.id === selectedRoleId) || null,
        [roles, selectedRoleId]
    );

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
        const previousRoleId = previousDrawerRoleIdRef.current;
        previousDrawerRoleIdRef.current = selectedRoleId;

        if (!selectedRoleId || previousRoleId === selectedRoleId || !drawerOverlayRef.current || !drawerPanelRef.current) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        const gsap = ensureGSAP();
        const ctx = gsap.context(() => {
            gsap.set(drawerOverlayRef.current, { opacity: 0 });
            gsap.set(drawerPanelRef.current, { xPercent: 10, opacity: 0.96 });

            gsap.to(drawerOverlayRef.current, {
                opacity: 1,
                duration: 0.24,
                ease: 'power2.out',
            });

            gsap.to(drawerPanelRef.current, {
                xPercent: 0,
                opacity: 1,
                duration: 0.42,
                ease: 'power3.out',
                clearProps: 'transform,opacity',
            });
        });

        return () => ctx.revert();
    }, [selectedRoleId]);

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
                setRolesInfo(nextRolesInfo);
                setPermissionsInfo(nextPermissionsInfo);
                setModules(nextModules);
                setPermissionRecords(nextPermissionRecords);
                setRoles(nextRoles);
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

    const openPermissionModal = (moduleId?: string) => {
        if (!isPremiumAccount) {
            setToast('Premium is required to create permissions');
            return;
        }
        setSelectedModuleId(moduleId || modules[0]?.id || null);
        setPermissionName('');
        setShowPermModal(true);
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
        if (!isPremiumAccount) {
            setToast('Premium is required to delete roles');
            return;
        }
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
        if (!isPremiumAccount) {
            setToast('Premium is required to edit roles');
            return;
        }
        setRoleForm({
            id: role.id,
            name: role.name,
            description: role.description,
            color: role.color,
            mode: 'edit',
        });
        setShowRoleModal(true);
    };

    const openCreateRoleModal = () => {
        if (!isPremiumAccount) {
            setToast('Premium is required to create roles');
            return;
        }
        setRoleForm({ id: '', name: '', description: '', color: ROLE_COLORS[0], mode: 'create' });
        setShowRoleModal(true);
    };

    const openRoleDetails = (roleId: string) => {
        setSelectedRoleId(roleId);
    };

    const closeRoleDetails = () => {
        if (!selectedRole) return;

        const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || !drawerOverlayRef.current || !drawerPanelRef.current) {
            setSelectedRoleId(null);
            return;
        }

        const closingRoleId = selectedRole.id;
        const gsap = ensureGSAP();
        gsap.to(drawerOverlayRef.current, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
        });
        gsap.to(drawerPanelRef.current, {
            xPercent: 10,
            opacity: 0.96,
            duration: 0.28,
            ease: 'power2.inOut',
            onComplete: () => {
                setSelectedRoleId((current) => (current === closingRoleId ? null : current));
            },
        });
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

    const handleSaveRole = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = roleForm.name.trim();
        const trimmedDescription = roleForm.description.trim();

        if (!trimmedName) {
            setToast('Please enter a role name');
            return;
        }

        setSavingRole(true);
        try {
            if (roleForm.mode === 'edit' && roleForm.id) {
                const response = await updateBackendRole(roleForm.id, { name: trimmedName, description: trimmedDescription });
                const updatedRole = response.data.data;

                setRoles((current) =>
                    current.map((role) =>
                        role.id === roleForm.id
                            ? {
                                  ...role,
                                  name: String(updatedRole.name ?? trimmedName),
                                  description: String(updatedRole.description ?? trimmedDescription),
                                  color: roleForm.color,
                                  raw: typeof updatedRole === 'object' && updatedRole ? { ...updatedRole, color: roleForm.color } : { ...role.raw, name: trimmedName, description: trimmedDescription, color: roleForm.color },
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
                                  String(item.id) === roleForm.id ? { ...item, name: trimmedName, description: trimmedDescription, color: roleForm.color } : item
                              ),
                          }
                        : current
                );
                setToast(`Role "${trimmedName}" updated`);
            } else {
                const response = await createBackendRole({ name: trimmedName, description: trimmedDescription });
                const createdRole = response.data.data;

                const newRole: MatrixRole = {
                    id: String(createdRole.id ?? `${slugify(trimmedName) || 'role'}-${Date.now()}`),
                    name: String(createdRole.name ?? trimmedName),
                    description: String(createdRole.description ?? trimmedDescription),
                    color: roleForm.color,
                    dotClass: pickRoleDotClass(trimmedName),
                    persisted: true,
                    sourceStatus: String(createdRole.status ?? 'active'),
                    permissionIds: [],
                    perms: Object.fromEntries(modules.map((module) => [module.id, Array(module.permissions.length).fill(0)])),
                    raw: typeof createdRole === 'object' && createdRole ? { ...createdRole, color: roleForm.color } : { name: trimmedName, description: trimmedDescription, color: roleForm.color },
                };

                setRoles((current) => [...current, newRole]);
                setRolesInfo((current) => current ? { ...current, items: [...current.items, newRole.raw] } : current);
                setToast(`Role "${trimmedName}" added`);
            }

            setRoleForm({ id: '', name: '', description: '', color: ROLE_COLORS[0], mode: 'create' });
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
        <DashboardCanvas>
            <DashboardContent className="max-w-[1400px]">
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Access / Roles</>}
                    title="Role management with the same control-room energy"
                    description="Review role coverage, inspect permission modules, and update access structure from a richer hero surface while keeping the live matrix workflow intact."
                    className="overflow-visible"
                    right={
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    className={cn(
                                        'rounded-2xl px-5 text-sm',
                                        showDocumentation
                                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                                            : 'bg-white text-slate-900 hover:bg-slate-100'
                                    )}
                                    onClick={() => setShowDocumentation(true)}
                                >
                                    Documentation
                                </Button>
                                {showDocumentation ? (
                                    <Button
                                        variant="outline"
                                        className="rounded-2xl border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-100"
                                        onClick={() => setShowDocumentation(false)}
                                    >
                                        Back to roles
                                    </Button>
                                ) : null}
                            </div>
                            <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                                <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">System health</div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-semibold text-slate-900">Role feed</span>
                                        <span className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Live
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-semibold text-slate-900">Module</span>
                                        <span className="text-xs font-extrabold text-slate-600">{rolesInfo?.module || 'roles'}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-semibold text-slate-900">Tenant</span>
                                        <span className="text-xs font-extrabold text-slate-600">{rolesInfo?.company_id?.slice(0, 8) || 'n/a'}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-semibold text-slate-900">Total roles</span>
                                        <span className="text-xs font-extrabold text-slate-600">{stats.roleCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-semibold text-slate-900">Permissions</span>
                                        <span className="text-xs font-extrabold text-emerald-700">{stats.permissionCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span className="text-sm font-semibold text-slate-900">Modules</span>
                                        <span className="text-xs font-extrabold text-amber-700">{stats.moduleCount}</span>
                                    </div>
                                </div>
                            </DashboardSurface>
                        </div>
                    }
                />

                {!showDocumentation ? (
                    <DashboardToolbar>
                        <div className="flex flex-wrap items-center gap-3">
                            <DashboardBadge>
                                {stats.roleCount} {stats.roleCount === 1 ? 'role' : 'roles'} across {stats.moduleCount} {stats.moduleCount === 1 ? 'module' : 'modules'}
                            </DashboardBadge>
                            <DashboardBadge className="bg-white/85">
                                {stats.permissionCount} permission {stats.permissionCount === 1 ? 'column' : 'columns'}
                            </DashboardBadge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <DashboardBadge>
                                Matrix ready
                            </DashboardBadge>
                            <Button
                                className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={openCreateRoleModal}
                            >
                                <ShieldPlus className="h-4 w-4" />
                                Add Role
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-2xl border-slate-300 bg-white/85 text-slate-700 hover:bg-slate-100"
                                onClick={() => openPermissionModal()}
                            >
                                <Plus className="h-4 w-4" />
                                Add Permission
                            </Button>
                        </div>
                    </DashboardToolbar>
                ) : (
                    <DashboardToolbar>
                        <div className="flex flex-wrap items-center gap-3">
                            <DashboardBadge tone="blue">Documentation open</DashboardBadge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <DashboardBadge tone="slate">Roles hidden</DashboardBadge>
                        </div>
                    </DashboardToolbar>
                )}

                {error ? (
                    <DashboardNotice className="mb-6">{error}</DashboardNotice>
                ) : null}

                <div hidden={showDocumentation} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {roles.map((role, roleIndex) => (
                            <section
                                key={role.id}
                                className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/70 shadow-[0_12px_34px_rgba(15,23,42,0.05)] backdrop-blur"
                            >
                                <div className="flex items-start justify-between gap-3 px-5 py-5">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span
                                            className={cn('mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-full', role.dotClass)}
                                            style={{ backgroundColor: role.color }}
                                        />
                                        <div className="min-w-0 min-h-[72px]">
                                            <h2 className="line-clamp-1 text-base font-semibold text-slate-950">{role.name}</h2>
                                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                                                {role.description || (role.persisted ? role.sourceStatus : 'local matrix state')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col border-t border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                                    <div className="grid gap-3">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Users</div>
                                            <div className="mt-1 text-2xl font-semibold text-slate-900">{getRoleUserCount(role)}</div>
                                            <div className="mt-1 text-xs text-slate-500">Assigned to this role</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Permissions</div>
                                            <div className="mt-1 text-2xl font-semibold text-slate-900">{getRolePermissionCount(role)}</div>
                                            <div className="mt-1 text-xs text-slate-500">Enabled for this role</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <Button
                                            variant="outline"
                                            className="rounded-2xl border-slate-300 bg-white/85 text-slate-700 hover:bg-slate-100"
                                            onClick={() => openRoleDetails(role.id)}
                                        >
                                            View permissions
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="rounded-xl bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                                onClick={() => openEditRoleModal(role)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-xl bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                                                onClick={() => void removeRole(roleIndex)}
                                                disabled={updatingRoleId === role.id}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}
                </div>

                <div hidden={!showDocumentation}>
                    <DashboardSurface className="mt-1">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                </div>
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
                                <label className="mb-2 block text-sm font-semibold text-slate-800">Description</label>
                                <input
                                    value={roleForm.description}
                                    onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
                                    placeholder="e.g. Manages content approvals and publishing"
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

            {selectedRole ? (
                <div className="fixed inset-0 z-[70]">
                    <button
                        type="button"
                        ref={drawerOverlayRef}
                        className="absolute inset-0 bg-slate-950/22 backdrop-blur-[3px]"
                        onClick={closeRoleDetails}
                        aria-label="Close role permissions"
                    />
                    <aside ref={drawerPanelRef} className="absolute right-0 top-0 h-full w-full md:w-[80vw] overflow-y-auto border-l border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] text-slate-900 shadow-[-24px_0_80px_rgba(15,23,42,0.18)]">
                        <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-6 py-5 backdrop-blur-xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Role Permissions</div>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedRole.name}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Review each permission and toggle access from this right-side control panel.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                    onClick={closeRoleDetails}
                                    aria-label="Close role details"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-5 p-6 xl:grid-cols-3">
                            {modules.map((module) => (
                                <section key={`${selectedRole.id}-${module.id}`} className="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-950">{module.name}</h3>
                                            <p className="text-sm text-slate-500">{module.permissions.length} permissions in this module</p>
                                        </div>
                                        <DashboardBadge className="bg-slate-100 text-slate-700">
                                            {(selectedRole.perms[module.id] || []).filter(Boolean).length} active
                                        </DashboardBadge>
                                    </div>

                                    <div className="grid gap-3">
                                        {module.permissions.map((permission, permIndex) => {
                                            const checked = !!selectedRole.perms[module.id]?.[permIndex];
                                            const roleIndex = roles.findIndex((role) => role.id === selectedRole.id);
                                            return (
                                                <div
                                                    key={`${selectedRole.id}-${module.id}-${permIndex}`}
                                                    className={cn(
                                                        'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition',
                                                        checked
                                                            ? 'border-slate-300 bg-slate-100'
                                                            : 'border-slate-200 bg-slate-50'
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-slate-900">{permission}</div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            {checked ? 'Active for this role' : 'Inactive for this role'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePermission(roleIndex, module.id, permIndex)}
                                                        disabled={updatingRoleId === selectedRole.id}
                                                        className={cn(
                                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 disabled:cursor-not-allowed disabled:opacity-60',
                                                            checked
                                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                : 'border-slate-300 bg-white text-transparent hover:border-slate-500'
                                                        )}
                                                        aria-pressed={checked}
                                                        aria-label={`${checked ? 'Revoke' : 'Grant'} ${permission} for ${selectedRole.name}`}
                                                    >
                                                        <span className="h-3 w-1.5 rotate-45 border-b-2 border-r-2 border-current" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </aside>
                </div>
            ) : null}

            {showPermModal && selectedModuleId ? (
                <DashboardModalFrame width="max-w-md">
                    <div className="w-full rounded-[20px] bg-white p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-950">Add New Permission</h2>
                            <p className="mt-1 text-sm text-slate-500">Create a new permission and add it to the system inactive for every role.</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">Module</label>
                                <select
                                    value={selectedModuleId}
                                    onChange={(event) => setSelectedModuleId(event.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                                >
                                    {modules.map((module) => (
                                        <option key={module.id} value={module.id}>
                                            {module.name}
                                        </option>
                                    ))}
                                </select>
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

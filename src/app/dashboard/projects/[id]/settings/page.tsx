'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { projectApi, teamApi } from '@/lib/api';

type ProjectRole = 'admins' | 'members';
type Capability =
    | 'add_project_admins'
    | 'create_columns'
    | 'delete_columns'
    | 'invite_members'
    | 'change_project_title_description';

type PermissionMatrix = Record<ProjectRole, Record<Capability, boolean>>;

type TeamMember = {
    user_id: number;
    name: string;
    email: string;
    role_name: string;
    role_id: number;
    joined_at: string;
};

type ProjectMember = {
    user_id: number;
    name: string;
    email: string;
    role: ProjectRole;
};

const MATRIX_STORAGE_PREFIX = 'project_permissions_';
const MEMBERS_STORAGE_PREFIX = 'project_members_';

const defaultMatrix: PermissionMatrix = {
    admins: {
        add_project_admins: true,
        create_columns: true,
        delete_columns: true,
        invite_members: true,
        change_project_title_description: true,
    },
    members: {
        add_project_admins: false,
        create_columns: false,
        delete_columns: false,
        invite_members: false,
        change_project_title_description: false,
    },
};

const capabilityLabels: Record<Capability, string> = {
    add_project_admins: 'Add other members as project admin',
    create_columns: 'Create new columns',
    delete_columns: 'Delete columns',
    invite_members: 'Invite members',
    change_project_title_description: 'Change project title and description',
};

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = Number(params.id);

    const matrixStorageKey = useMemo(() => `${MATRIX_STORAGE_PREFIX}${projectId}`, [projectId]);
    const membersStorageKey = useMemo(() => `${MEMBERS_STORAGE_PREFIX}${projectId}`, [projectId]);

    const [savedMessage, setSavedMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<ProjectRole>('members');

    const [matrix, setMatrix] = useState<PermissionMatrix>(() => {
        const raw = localStorage.getItem(matrixStorageKey);
        if (!raw) return defaultMatrix;
        try {
            return JSON.parse(raw) as PermissionMatrix;
        } catch {
            return defaultMatrix;
        }
    });

    useEffect(() => {
        const init = async () => {
            try {
                const projectRes = await projectApi.getProject(projectId);
                const projectData = projectRes.data.data as { team_id?: number; created_by?: number };
                const teamId = projectData.team_id;
                const createdBy = projectData.created_by;

                if (!teamId) {
                    setTeamMembers([]);
                    setProjectMembers([]);
                    return;
                }

                const membersRes = await teamApi.getMembers(teamId);
                const members = (membersRes.data.data || []) as TeamMember[];
                setTeamMembers(members);

                const storedMembers = localStorage.getItem(membersStorageKey);
                let nextProjectMembers: ProjectMember[] = [];

                if (storedMembers) {
                    try {
                        nextProjectMembers = JSON.parse(storedMembers) as ProjectMember[];
                    } catch {
                        nextProjectMembers = [];
                    }
                }

                if (nextProjectMembers.length === 0 && createdBy) {
                    const creator = members.find((m) => m.user_id === createdBy);
                    if (creator) {
                        nextProjectMembers = [{
                            user_id: creator.user_id,
                            name: creator.name,
                            email: creator.email,
                            role: 'admins',
                        }];
                    } else {
                        nextProjectMembers = [{
                            user_id: createdBy,
                            name: `User #${createdBy}`,
                            email: '',
                            role: 'admins',
                        }];
                    }
                }

                if (createdBy) {
                    nextProjectMembers = nextProjectMembers.map((m) =>
                        m.user_id === createdBy ? { ...m, role: 'admins' } : m
                    );
                    const exists = nextProjectMembers.some((m) => m.user_id === createdBy);
                    if (!exists) {
                        const creator = members.find((m) => m.user_id === createdBy);
                        nextProjectMembers.unshift({
                            user_id: createdBy,
                            name: creator?.name || `User #${createdBy}`,
                            email: creator?.email || '',
                            role: 'admins',
                        });
                    }
                }

                setProjectMembers(nextProjectMembers);
                localStorage.setItem(membersStorageKey, JSON.stringify(nextProjectMembers));
            } finally {
                setLoading(false);
            }
        };

        void init();
    }, [membersStorageKey, projectId]);

    const availableToAdd = useMemo(
        () => teamMembers.filter((m) => !projectMembers.some((pm) => pm.user_id === m.user_id)),
        [teamMembers, projectMembers]
    );

    useEffect(() => {
        if (!availableToAdd.length) {
            setSelectedMemberId(null);
            return;
        }
        setSelectedMemberId((prev) => (prev && availableToAdd.some((m) => m.user_id === prev) ? prev : availableToAdd[0].user_id));
    }, [availableToAdd]);

    const toggleCapability = (role: ProjectRole, capability: Capability) => {
        setMatrix((prev) => ({
            ...prev,
            [role]: {
                ...prev[role],
                [capability]: !prev[role][capability],
            },
        }));
    };

    const addProjectMember = () => {
        if (!selectedMemberId) return;
        const member = teamMembers.find((m) => m.user_id === selectedMemberId);
        if (!member) return;

        setProjectMembers((prev) => [
            ...prev,
            {
                user_id: member.user_id,
                name: member.name,
                email: member.email,
                role: selectedRole,
            },
        ]);
    };

    const updateProjectMemberRole = (userId: number, role: ProjectRole) => {
        setProjectMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } : m)));
    };

    const removeProjectMember = (userId: number) => {
        setProjectMembers((prev) => prev.filter((m) => m.user_id !== userId));
    };

    const saveSettings = () => {
        localStorage.setItem(matrixStorageKey, JSON.stringify(matrix));
        localStorage.setItem(membersStorageKey, JSON.stringify(projectMembers));
        setSavedMessage('Project permissions and members saved');
        window.setTimeout(() => setSavedMessage(''), 1500);
    };

    return (
        <DashboardCanvas>
            <DashboardContent>
            <DashboardHero
                eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Project Settings</>}
                title="Project-level roles and permissions in the shared dashboard style"
                description="Define project-level permissions and members. The project creator remains an Admin by design."
                right={
                    <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                        <Button variant="ghost" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
                            Back to Project
                        </Button>
                    </DashboardSurface>
                }
            />

            {loading ? (
                <DashboardSurface className="text-sm text-muted-foreground">Loading project settings...</DashboardSurface>
            ) : (
                <>
                    <DashboardSurface className="space-y-4">
                        <h2 className="text-base font-semibold text-foreground">Project Members</h2>
                        <p className="text-sm text-muted-foreground">
                            Add team members to this project and set their role as Admin or Member.
                        </p>

                        <div className="grid gap-3 md:grid-cols-[1fr,180px,auto]">
                            <select
                                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                value={selectedMemberId ?? ''}
                                onChange={(e) => setSelectedMemberId(e.target.value ? Number(e.target.value) : null)}
                                disabled={!availableToAdd.length}
                            >
                                {availableToAdd.length === 0 ? (
                                    <option value="">No team members available</option>
                                ) : (
                                    availableToAdd.map((m) => (
                                        <option key={m.user_id} value={m.user_id}>
                                            {m.name} ({m.email})
                                        </option>
                                    ))
                                )}
                            </select>
                            <select
                                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                            >
                                <option value="admins">Admin</option>
                                <option value="members">Member</option>
                            </select>
                            <Button onClick={addProjectMember} disabled={!selectedMemberId || !availableToAdd.length}>Add to Project</Button>
                        </div>

                        <div className="rounded-md border border-border">
                            <div className="grid grid-cols-[1fr,200px,120px] border-b border-border px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                                <span>Member</span>
                                <span>Role</span>
                                <span className="text-right">Action</span>
                            </div>
                            <div className="divide-y divide-border">
                                {projectMembers.map((m) => (
                                    <div key={m.user_id} className="grid grid-cols-[1fr,200px,120px] items-center px-3 py-2">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                                            <p className="text-xs text-muted-foreground">{m.email || 'No email'}</p>
                                        </div>
                                        <select
                                            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                                            value={m.role}
                                            onChange={(e) => updateProjectMemberRole(m.user_id, e.target.value as ProjectRole)}
                                        >
                                            <option value="admins">Admin</option>
                                            <option value="members">Member</option>
                                        </select>
                                        <div className="text-right">
                                            <Button variant="outline" onClick={() => removeProjectMember(m.user_id)}>
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DashboardSurface>

                    <DashboardSurface className="space-y-4">
                        <h2 className="text-base font-semibold text-foreground">Role Permissions</h2>
                        <p className="text-sm text-muted-foreground">
                            Admins and Members are the available project roles. Configure what each role can do in this project.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Capability</th>
                                        <th className="border-b border-border px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Admins</th>
                                        <th className="border-b border-border px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Members</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Object.keys(capabilityLabels) as Capability[]).map((capability) => (
                                        <tr key={capability}>
                                            <td className="border-b border-border px-3 py-3 text-sm text-foreground">{capabilityLabels[capability]}</td>
                                            <td className="border-b border-border px-3 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={matrix.admins[capability]}
                                                    onChange={() => toggleCapability('admins', capability)}
                                                />
                                            </td>
                                            <td className="border-b border-border px-3 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={matrix.members[capability]}
                                                    onChange={() => toggleCapability('members', capability)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            {savedMessage ? <span className="text-sm text-emerald-600">{savedMessage}</span> : null}
                            <Button onClick={saveSettings}>Save Settings</Button>
                        </div>
                    </DashboardSurface>
                </>
            )}
            </DashboardContent>
        </DashboardCanvas>
    );
}

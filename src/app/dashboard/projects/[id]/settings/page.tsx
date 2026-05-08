'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { projectApi, teamApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

type TeamMember = {
    user_id: string;
    name: string;
    email: string;
};

type ProjectMember = {
    user_id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
};

type ProjectRecord = {
    id: string;
    name: string;
    description?: string;
    sprint_size?: number | null;
    sprint_start_date?: string;
};

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = String(params.id || '');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedMessage, setSavedMessage] = useState('');
    const [project, setProject] = useState<ProjectRecord | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [projectRes, teamsRes] = await Promise.all([
                    projectApi.getProject(projectId),
                    teamApi.getMyTeams(),
                ]);
                if (!active) return;

                const nextProject = (projectRes.data.data || {}) as ProjectRecord;
                setProject(nextProject);

                const firstTeam = teamsRes.data.data?.[0];
                if (!firstTeam?.id) {
                    setTeamMembers([]);
                    setProjectMembers([]);
                    return;
                }

                const [membersRes, projectMembersRes] = await Promise.all([
                    teamApi.getMembers(firstTeam.id),
                    projectApi.getMembers(projectId),
                ]);
                if (!active) return;

                setTeamMembers(
                    ((membersRes.data.data || []) as Array<{ user_id: string | number; name: string; email: string }>).map((member) => ({
                        user_id: String(member.user_id),
                        name: member.name,
                        email: member.email,
                    }))
                );
                setProjectMembers(
                    ((projectMembersRes.data.data || []) as Array<{ user_id: string | number; name: string; email: string; role: string }>).map((member) => ({
                        user_id: String(member.user_id),
                        name: member.name,
                        email: member.email,
                        role: member.role === 'admin' ? 'admin' : 'member',
                    }))
                );
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, 'Failed to load project settings'));
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [projectId]);

    const availableToAdd = useMemo(
        () => teamMembers.filter((member) => !projectMembers.some((projectMember) => projectMember.user_id === member.user_id)),
        [teamMembers, projectMembers]
    );

    useEffect(() => {
        if (!availableToAdd.length) {
            setSelectedMemberId('');
            return;
        }
        setSelectedMemberId((current) => (current && availableToAdd.some((member) => member.user_id === current) ? current : availableToAdd[0].user_id));
    }, [availableToAdd]);

    const addProjectMember = () => {
        if (!selectedMemberId) return;
        const member = teamMembers.find((item) => item.user_id === selectedMemberId);
        if (!member) return;
        setProjectMembers((current) => [
            ...current,
            {
                user_id: member.user_id,
                name: member.name,
                email: member.email,
                role: selectedRole,
            },
        ]);
    };

    const updateProjectMemberRole = (userId: string, role: 'admin' | 'member') => {
        setProjectMembers((current) => current.map((member) => (member.user_id === userId ? { ...member, role } : member)));
    };

    const removeProjectMember = (userId: string) => {
        setProjectMembers((current) => current.filter((member) => member.user_id !== userId));
    };

    const saveMembers = async () => {
        setSaving(true);
        setError(null);
        setSavedMessage('');
        try {
            const response = await projectApi.updateMembers(
                projectId,
                projectMembers.map((member) => ({ user_id: member.user_id, role: member.role }))
            );
            setProjectMembers((response.data.data || []) as ProjectMember[]);
            setSavedMessage('Project access updated');
            window.setTimeout(() => setSavedMessage(''), 1600);
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, 'Failed to save project members'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Project Access</>}
                    title={project?.name ? `${project.name} access and members` : 'Project access and members'}
                    description="Only invited members can see this project. Project admins can edit the project, manage columns, and invite other teammates."
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
                ) : error ? (
                    <DashboardSurface className="text-sm text-red-600">{error}</DashboardSurface>
                ) : (
                    <>
                        <DashboardSurface className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-foreground">Project Setup</h2>
                                <p className="text-sm text-muted-foreground">Sprint size and start date are now stored with the project and travel with everyone who has access.</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sprint Size</div>
                                    <div className="mt-2 text-2xl font-semibold text-foreground">{project?.sprint_size || 'Not set'}</div>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sprint Start</div>
                                    <div className="mt-2 text-2xl font-semibold text-foreground">{project?.sprint_start_date || 'Not set'}</div>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visible To</div>
                                    <div className="mt-2 text-2xl font-semibold text-foreground">{projectMembers.length}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">invited members</div>
                                </div>
                            </div>
                        </DashboardSurface>

                        <DashboardSurface className="space-y-4">
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-foreground">Invite Members</h2>
                                <p className="text-sm text-muted-foreground">Invite teammates to this project and decide whether they join as project admins or project members.</p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[1fr,180px,auto]">
                                <select
                                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    value={selectedMemberId}
                                    onChange={(event) => setSelectedMemberId(event.target.value)}
                                    disabled={!availableToAdd.length}
                                >
                                    {availableToAdd.length === 0 ? (
                                        <option value="">No more team members to invite</option>
                                    ) : (
                                        availableToAdd.map((member) => (
                                            <option key={member.user_id} value={member.user_id}>
                                                {member.name || member.email} ({member.email})
                                            </option>
                                        ))
                                    )}
                                </select>
                                <select
                                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    value={selectedRole}
                                    onChange={(event) => setSelectedRole(event.target.value as 'admin' | 'member')}
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <Button onClick={addProjectMember} disabled={!selectedMemberId || !availableToAdd.length}>Add to Project</Button>
                            </div>

                            <div className="rounded-md border border-border">
                                <div className="grid grid-cols-[1fr,160px,120px] border-b border-border px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                                    <span>Member</span>
                                    <span>Role</span>
                                    <span className="text-right">Action</span>
                                </div>
                                <div className="divide-y divide-border">
                                    {projectMembers.map((member) => (
                                        <div key={member.user_id} className="grid grid-cols-[1fr,160px,120px] items-center px-3 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{member.name || 'Unnamed user'}</p>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            </div>
                                            <select
                                                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                value={member.role}
                                                onChange={(event) => updateProjectMemberRole(member.user_id, event.target.value as 'admin' | 'member')}
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <div className="text-right">
                                                <Button variant="outline" onClick={() => removeProjectMember(member.user_id)}>
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                {savedMessage ? <span className="text-sm text-emerald-600">{savedMessage}</span> : null}
                                <Button onClick={saveMembers} isLoading={saving}>Save Access</Button>
                            </div>
                        </DashboardSurface>
                    </>
                )}
            </DashboardContent>
        </DashboardCanvas>
    );
}

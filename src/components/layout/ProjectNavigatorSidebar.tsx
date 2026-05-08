"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Folder,
    Menu,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import api, { projectApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { useUI } from "@/components/providers/ui-provider";
import { DashboardModalFrame } from "./dashboard-visuals";

type ProjectItem = {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    sprint_size?: number | null;
    sprint_start_date?: string;
    created_at?: string;
};

type TeamSummary = {
    id: string;
    name: string;
};

type TeamMemberItem = {
    user_id: string;
    name: string;
    email: string;
};

const PAGE_SIZE = 5;
const SWATCHES = [
    "bg-lime-300",
    "bg-pink-400",
    "bg-cyan-300",
    "bg-blue-500",
    "bg-violet-400",
    "bg-slate-500",
    "bg-indigo-500",
    "bg-fuchsia-300",
];

function projectSwatch(projectId: string) {
    const total = projectId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return SWATCHES[total % SWATCHES.length];
}

function truncateLabel(value: string, max = 26) {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function ProjectNavigatorSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { settings, updateSettings } = useUI();
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
    const [creatingProject, setCreatingProject] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
    const [form, setForm] = useState({ name: "", description: "", icon: "", sprintSize: "", sprintStartDate: "" });
    const [selectedMembers, setSelectedMembers] = useState<Record<string, "admin" | "member">>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;

        const loadProjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get<{ data: ProjectItem[] }>("/projects");
                const teamsResponse = await api.get<{ data: TeamSummary[] }>("/teams");
                if (!active) return;
                const items = (response.data.data || []).slice().sort((a, b) => {
                    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return bTime - aTime;
                });
                setProjects(items);
                const firstTeam = teamsResponse.data.data?.[0];
                if (firstTeam?.id) {
                    const membersResponse = await api.get<{ data: TeamMemberItem[] }>(`/teams/${firstTeam.id}/members`);
                    if (!active) return;
                    setTeamMembers(membersResponse.data.data || []);
                }
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, "Failed to load projects"));
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadProjects();
        return () => {
            active = false;
        };
    }, []);

    const selectedProjectId = useMemo(() => {
        const match = pathname.match(/^\/dashboard\/projects\/([^/]+)$/);
        return match?.[1] || "";
    }, [pathname]);

    const visibleProjects = useMemo(() => projects.slice(0, visibleCount), [projects, visibleCount]);
    const canLoadMore = visibleCount < projects.length;
    const starredProjects = useMemo(() => visibleProjects.slice(0, Math.min(3, visibleProjects.length)), [visibleProjects]);

    const toggleSidebar = () => {
        updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed });
    };

    const goToProject = (projectId: string) => {
        router.push(`/dashboard/projects/${projectId}`);
        onClose();
    };

    const openEditProject = (project: ProjectItem) => {
        setEditingProject(project);
        setForm({
            name: project.name || "",
            description: project.description || "",
            icon: project.icon || "",
            sprintSize: project.sprint_size ? String(project.sprint_size) : "",
            sprintStartDate: project.sprint_start_date || "",
        });
        setSelectedMembers({});
    };

    const openCreateProject = () => {
        setCreatingProject(true);
        setEditingProject(null);
        setForm({ name: "", description: "", icon: "", sprintSize: "", sprintStartDate: "" });
        setSelectedMembers({});
    };

    const closeProjectModal = () => {
        setCreatingProject(false);
        setEditingProject(null);
        setForm({ name: "", description: "", icon: "", sprintSize: "", sprintStartDate: "" });
        setSelectedMembers({});
    };

    const handleSaveProject = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if ((!editingProject && !creatingProject) || !form.name.trim() || saving) return;

        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                icon: form.icon.trim(),
                sprint_size: form.sprintSize.trim() ? Number(form.sprintSize) : null,
                sprint_start_date: form.sprintStartDate || "",
            };
            if (editingProject) {
                const response = await projectApi.updateProject(editingProject.id, "", payload);
                const updated = (response.data.data || {}) as Partial<ProjectItem>;
                setProjects((current) =>
                    current.map((project) =>
                        project.id === editingProject.id
                            ? {
                                  ...project,
                                  ...updated,
                                  name: String(updated.name ?? form.name.trim()),
                                  description: String(updated.description ?? form.description.trim()),
                                  icon: String(updated.icon ?? form.icon.trim()),
                              }
                            : project
                    )
                );
            } else {
                const members = Object.entries(selectedMembers).map(([user_id, role]) => ({ user_id, role }));
                const response = await projectApi.createProject("", { ...payload, members });
                const created = (response.data.data || {}) as ProjectItem;
                setProjects((current) => [created, ...current]);
                if (created.id) {
                    router.push(`/dashboard/projects/${created.id}`);
                }
            }
            closeProjectModal();
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, editingProject ? "Failed to update project" : "Failed to create project"));
        } finally {
            setSaving(false);
        }
    };

    const toggleSelectedMember = (userId: string) => {
        setSelectedMembers((current) => {
            if (current[userId]) {
                const next = { ...current };
                delete next[userId];
                return next;
            }
            return { ...current, [userId]: "member" };
        });
    };

    const updateSelectedMemberRole = (userId: string, role: "admin" | "member") => {
        setSelectedMembers((current) => ({ ...current, [userId]: role }));
    };

    const handleDeleteProject = async (project: ProjectItem) => {
        if (!window.confirm(`Delete project "${project.name}"?`)) return;

        setError(null);
        try {
            await projectApi.deleteProject(project.id, "");
            const remainingProjects = projects.filter((item) => item.id !== project.id);
            setProjects(remainingProjects);
            if (project.id === selectedProjectId) {
                const nextProject = remainingProjects[0];
                router.push(nextProject ? `/dashboard/projects/${nextProject.id}` : "/dashboard/projects");
            }
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, "Failed to delete project"));
        }
    };

    const renderProjectRow = (project: ProjectItem, starred = false) => {
        const active = project.id === selectedProjectId;

        return (
            <div
                key={`${starred ? "starred" : "project"}-${project.id}`}
                className={cn(
                    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    active ? "bg-primary/10 text-primary shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    settings.enableAnimations && "hover:translate-x-1"
                )}
            >
                <button type="button" onClick={() => goToProject(project.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    {starred ? (
                        <Folder className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    ) : (
                        <span className={cn("h-3.5 w-3.5 shrink-0 rounded-[4px]", projectSwatch(project.id))} />
                    )}
                    <span className="truncate">{truncateLabel(project.name, starred ? 22 : 24)}</span>
                </button>

                {!settings.sidebarCollapsed && (
                    <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={() => openEditProject(project)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={`Edit ${project.name}`}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleDeleteProject(project)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                            aria-label={`Delete ${project.name}`}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className={cn("fixed inset-0 z-40 bg-black/50 lg:hidden", isOpen ? "block" : "hidden")} onClick={onClose} />

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
                    settings.enableGlassmorphism
                        ? "border-border lg:border-border/60 lg:bg-background/60 lg:backdrop-blur-2xl lg:supports-[backdrop-filter]:bg-background/40 dark:lg:border-white/10"
                        : "bg-sidebar border-slate-300 dark:border-sidebar-border",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    settings.sidebarCollapsed ? "w-20" : "w-[290px]"
                )}
            >
                <div className={cn("flex h-16 items-center border-b border-border/10", settings.sidebarCollapsed ? "justify-center px-0" : "justify-between px-6")}>
                    {settings.sidebarCollapsed ? (
                        <button type="button" onClick={toggleSidebar} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Menu className="h-4 w-4" />
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={toggleSidebar} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                                    <Menu className="h-4 w-4" />
                                </button>
                                <Image src="/golem-logo.svg" alt="paladin.mx" width={132} height={34} className="h-auto w-[132px]" priority />
                            </div>
                            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden h-8 w-8 lg:flex">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>

                <div className={cn("border-b border-border/10 p-3", settings.sidebarCollapsed && "px-2")}>
                    <Link
                        href="/dashboard"
                        onClick={onClose}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground",
                            settings.enableAnimations && "hover:translate-x-1",
                            settings.sidebarCollapsed && "justify-center px-0"
                        )}
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        {!settings.sidebarCollapsed && <span>Back to Dashboard</span>}
                    </Link>
                </div>

                <div className={cn("flex-1 overflow-y-auto p-2 pt-4", settings.sidebarCollapsed ? "px-2" : "px-2")}>
                    {loading ? (
                        <div className="px-3 py-3 text-sm text-muted-foreground">Loading projects...</div>
                    ) : error ? (
                        <div className="rounded-md bg-red-500/10 px-3 py-3 text-sm text-red-600">{error}</div>
                    ) : settings.sidebarCollapsed ? (
                        <div className="space-y-2">
                            {visibleProjects.map((project) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    onClick={() => goToProject(project.id)}
                                    className={cn(
                                        "flex w-full justify-center rounded-md px-0 py-3 transition-all duration-200",
                                        project.id === selectedProjectId ? "bg-primary/10 shadow-md" : "hover:bg-muted"
                                    )}
                                    title={project.name}
                                >
                                    <div className={cn("h-3.5 w-3.5 rounded-[4px]", projectSwatch(project.id))} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <div className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Starred</div>
                                {starredProjects.map((project) => renderProjectRow(project, true))}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    <span>Projects</span>
                                    <button
                                        type="button"
                                        onClick={openCreateProject}
                                        className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                        aria-label="Create project"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                {visibleProjects.map((project) => renderProjectRow(project))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={cn("border-t border-border/10 p-4", settings.sidebarCollapsed && "flex justify-center")}>
                    {settings.sidebarCollapsed ? (
                        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden h-8 w-8 lg:flex">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <button
                            type="button"
                            disabled={!canLoadMore}
                            onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                            className="w-full rounded-md border border-border/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {canLoadMore ? "Load older projects" : "No more projects"}
                        </button>
                    )}
                </div>
            </aside>

            {editingProject || creatingProject ? (
                <DashboardModalFrame width="max-w-lg">
                    <div className="border-b border-slate-200 px-6 py-5">
                        <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{editingProject ? "Edit Project" : "Create Project"}</h2>
                    </div>
                    <div className="px-6 py-6">
                        <form onSubmit={handleSaveProject} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
                                <input
                                    value={form.name}
                                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    placeholder="Platform Revamp"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                    className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    placeholder="What this project is about"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-foreground">Icon</label>
                                <input
                                    value={form.icon}
                                    onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    placeholder="PRJ"
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">Sprint Size</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.sprintSize}
                                        onChange={(event) => setForm((current) => ({ ...current, sprintSize: event.target.value }))}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        placeholder="14"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">Sprint Start Date</label>
                                    <input
                                        type="date"
                                        value={form.sprintStartDate}
                                        onChange={(event) => setForm((current) => ({ ...current, sprintStartDate: event.target.value }))}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                </div>
                            </div>
                            {!editingProject ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-foreground">Invite Team Members</label>
                                        <p className="text-xs text-muted-foreground">Only invited members will see this project in their sidebar.</p>
                                    </div>
                                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border/60 p-3">
                                        {teamMembers.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">No team members available yet.</div>
                                        ) : (
                                            teamMembers.map((member) => (
                                                <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/70">
                                                    <label className="flex min-w-0 flex-1 items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(selectedMembers[member.user_id])}
                                                            onChange={() => toggleSelectedMember(member.user_id)}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium text-foreground">{member.name || member.email}</div>
                                                            <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                                                        </div>
                                                    </label>
                                                    <select
                                                        value={selectedMembers[member.user_id] || "member"}
                                                        onChange={(event) => updateSelectedMemberRole(member.user_id, event.target.value as "admin" | "member")}
                                                        disabled={!selectedMembers[member.user_id]}
                                                        className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : null}
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={closeProjectModal} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={saving}>
                                    {editingProject ? "Save" : "Create Project"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DashboardModalFrame>
            ) : null}
        </>
    );
}

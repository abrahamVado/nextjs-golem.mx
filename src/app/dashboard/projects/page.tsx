"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardModalFrame, DashboardNotice, DashboardSurface, DashboardToolbar } from "@/components/layout/dashboard-visuals";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

type Project = {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    created_at?: string;
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", description: "", icon: "" });

    useEffect(() => {
        let active = true;

        const loadProjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get<{ data: Project[] }>("/projects");
                if (!active) return;
                setProjects(response.data.data || []);
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

    const filteredProjects = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return projects;
        return projects.filter((project) =>
            project.name.toLowerCase().includes(query) ||
            (project.description || "").toLowerCase().includes(query)
        );
    }, [projects, search]);

    const openCreateModal = () => {
        setModalMode("create");
        setEditingProjectId(null);
        setForm({ name: "", description: "", icon: "" });
        setCreateOpen(true);
    };

    const openEditModal = (project: Project) => {
        setModalMode("edit");
        setEditingProjectId(project.id);
        setForm({
            name: project.name || "",
            description: project.description || "",
            icon: project.icon || "",
        });
        setCreateOpen(true);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim() || saving) return;

        try {
            setSaving(true);
            if (modalMode === "edit" && editingProjectId) {
                const response = await api.put<{ data: Project }>(`/projects/${editingProjectId}`, {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    icon: form.icon.trim(),
                });
                const updated = response.data.data;
                setProjects((prev) => prev.map((project) => project.id === updated.id ? { ...project, ...updated } : project));
            } else {
                const response = await api.post<{ data: Project }>("/projects", {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    icon: form.icon.trim(),
                });
                const created = response.data.data;
                setProjects((prev) => [...prev, created]);
            }
            setCreateOpen(false);
            setEditingProjectId(null);
            setForm({ name: "", description: "", icon: "" });
            setError(null);
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, modalMode === "edit" ? "Failed to update project" : "Failed to create project"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Projects</>}
                    title="Projects with the same rounded, glassy command-center language"
                    description="Browse active projects and create new workspaces for Kanban boards inside the new shared dashboard visual system."
                />

                <DashboardToolbar>
                    <div className="min-w-[220px] max-w-md">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects"
                        />
                    </div>
                    <Button onClick={openCreateModal}>New Project</Button>
                </DashboardToolbar>

            {error ? (
                <DashboardNotice tone="red">{error}</DashboardNotice>
            ) : null}

            {loading ? (
                <DashboardSurface className="text-sm text-muted-foreground">
                    Loading projects...
                </DashboardSurface>
            ) : filteredProjects.length === 0 ? (
                <DashboardSurface>
                    <DashboardEmpty
                        title="No projects yet"
                        description="Create your first project and it will be available in Kanban immediately."
                        action={<Button onClick={openCreateModal}>Create Project</Button>}
                    />
                </DashboardSurface>
            ) : (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className="block rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
                                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                                            {project.description || "No description yet."}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                openEditModal(project);
                                            }}
                                            className="rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700"
                                            title={`Edit ${project.name}`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                                            {project.icon || "PRJ"}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-muted-foreground">
                                    {project.created_at ? `Created ${new Date(project.created_at).toLocaleDateString()}` : "Ready for Kanban"}
                                </div>
                            </Link>
                    ))}
                </section>
            )}

            {createOpen ? (
            <DashboardModalFrame width="max-w-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{modalMode === "edit" ? "Edit Project" : "Create Project"}</h2>
                </div>
                <div className="px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Platform Revamp"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
                        <textarea
                            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="What this project is about"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Icon</label>
                        <Input
                            value={form.icon}
                            onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                            placeholder="fas fa-rocket"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={saving}>
                            {modalMode === "edit" ? "Save" : "Create"}
                        </Button>
                    </div>
                </form>
                </div>
            </DashboardModalFrame>
            ) : null}
            </DashboardContent>
        </DashboardCanvas>
    );
}

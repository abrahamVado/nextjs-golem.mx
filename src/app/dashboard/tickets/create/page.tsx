"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardNotice, DashboardSurface } from "@/components/layout/dashboard-visuals";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { projectApi, taskApi, teamApi } from "@/lib/api";
import { ProjectSummary } from "@/types";
import { ArrowLeft, AlertTriangle } from "lucide-react";

type FormState = {
    projectId: string;
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate: string;
};

const defaultForm: FormState = {
    projectId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
};

function toProjectSummary(input: Record<string, unknown>): ProjectSummary {
    return {
        id: String(input.id || ""),
        name: String(input.name || "Untitled project"),
        description: typeof input.description === "string" ? input.description : undefined,
        icon: typeof input.icon === "string" ? input.icon : undefined,
        sprint_size: typeof input.sprint_size === "number" ? input.sprint_size : null,
        sprint_start_date: typeof input.sprint_start_date === "string" ? input.sprint_start_date : undefined,
    };
}

export default function CreateTicketPage() {
    const router = useRouter();

    const [teamId, setTeamId] = useState<string>("");
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [form, setForm] = useState<FormState>(defaultForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const teamsResponse = await teamApi.getMyTeams();
                const nextTeamId = String(teamsResponse.data.data?.[0]?.id || "");
                const projectsResponse = await projectApi.listProjects(nextTeamId);
                if (!active) return;

                const nextProjects = (projectsResponse.data.data || []).map((item) => toProjectSummary(item as Record<string, unknown>));
                setTeamId(nextTeamId);
                setProjects(nextProjects);
                setForm((current) => ({
                    ...current,
                    projectId: current.projectId || nextProjects[0]?.id || "",
                }));
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, "Failed to load ticket creation options"));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.projectId) {
            setError("Select a project before creating a ticket.");
            return;
        }
        if (!form.title.trim()) {
            setError("Ticket title is required.");
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const selectedProject = projects.find((project) => project.id === form.projectId);
            const response = await taskApi.create(form.projectId, teamId, {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                priority: form.priority,
                status: "todo",
                due_date: form.dueDate ? `${form.dueDate}T00:00:00Z` : undefined,
            });

            const createdId = String(response.data.data?.id || "");
            setSuccessMessage("Ticket created successfully.");
            setForm({
                ...defaultForm,
                projectId: form.projectId,
            });

            if (createdId) {
                const query = new URLSearchParams({
                    projectId: form.projectId,
                });
                if (selectedProject?.name) {
                    query.set("projectName", selectedProject.name);
                }
                query.set("ticketNumber", `TKT-${createdId.slice(0, 8).toUpperCase()}`);
                router.push(`/dashboard/tickets/${encodeURIComponent(createdId)}?${query.toString()}`);
            } else {
                router.push("/dashboard/tickets");
            }
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, "Failed to create ticket"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Create Ticket</>}
                    title="Capture a new support request in the current MVP workflow"
                    description="This creates a task-backed ticket inside the selected project so the team can start triage and delivery immediately."
                    right={
                        <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                            <Button variant="ghost" onClick={() => router.push("/dashboard/tickets")}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Inbox
                            </Button>
                        </DashboardSurface>
                    }
                />

                {error ? (
                    <DashboardNotice tone="red">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <h3 className="font-semibold">We couldn&apos;t create this ticket</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                    </DashboardNotice>
                ) : null}

                {successMessage ? <DashboardNotice tone="emerald">{successMessage}</DashboardNotice> : null}

                <DashboardSurface>
                    {isLoading ? (
                        <div className="text-sm text-slate-600">Loading available projects...</div>
                    ) : projects.length === 0 ? (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">You need at least one project before you can create a ticket in this MVP flow.</p>
                            <Button onClick={() => router.push("/dashboard/projects")}>Open Projects</Button>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-slate-900">Project</span>
                                    <select
                                        className="h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        value={form.projectId}
                                        onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}
                                    >
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-slate-900">Priority</span>
                                    <select
                                        className="h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        value={form.priority}
                                        onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as FormState["priority"] }))}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </label>
                            </div>

                            <label className="space-y-2 block">
                                <span className="text-sm font-medium text-slate-900">Title</span>
                                <Input
                                    value={form.title}
                                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                    placeholder="Client cannot access billing portal"
                                />
                            </label>

                            <label className="space-y-2 block">
                                <span className="text-sm font-medium text-slate-900">Description</span>
                                <Textarea
                                    rows={6}
                                    value={form.description}
                                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                    placeholder="Describe the request, impact, reproduction steps, and any immediate context the support team should know."
                                />
                            </label>

                            <label className="space-y-2 block md:max-w-xs">
                                <span className="text-sm font-medium text-slate-900">Due Date</span>
                                <Input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                                />
                            </label>

                            <div className="flex flex-wrap items-center justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/tickets")}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={isSaving}>
                                    Create Ticket
                                </Button>
                            </div>
                        </form>
                    )}
                </DashboardSurface>
            </DashboardContent>
        </DashboardCanvas>
    );
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import api from "@/lib/api";
import { z } from "zod";
import { useUI } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DashboardBadge, DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardNotice, DashboardSurface } from "@/components/layout/dashboard-visuals";
import CreateTaskModal from "./components/CreateTaskModal";
import EditTaskModal from "./components/EditTaskModal";
import NewColumnModal from "./components/NewColumnModal";

import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    closestCorners,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Task, Column, Project, TeamMember, TimeEntry, TaskFileRef, ApiTimeEntry, ChecklistItem, Priority } from "./types";
import SortableColumn from "./components/SortableColumn";
import TaskCard from "./components/TaskCard";
import { AlertTriangle, FolderPlus, LayoutGrid, Pencil, Plus, Search, User, Zap } from "lucide-react";
import "./kanban.css";

type FilterMode = "all" | "mine" | "high";
type ToastType = "success" | "error" | "warning";

const TAGS = ["feature", "bug", "enhancement", "ui", "documentation", "security", "backend", "performance"];
const STORAGE_PROJECT = "current_project_id";
const STORAGE_TIME_PREFIX = "kanban_task_time_";
const TASK_TIME_MIGRATED_PREFIX = "kanban_task_time_migrated_";

const taskSchema = z.object({
    title: z.string().trim().min(1, "Task title is required"),
    column_key: z.string().trim().min(1, "Column is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD").optional(),
    checklist: z.array(
        z.object({
            text: z.string().trim().min(1, "Checklist items cannot be empty"),
            completed: z.boolean().optional(),
        })
    ),
    story_points: z.number().int().min(0).max(100).nullable().optional(),
});



const columnColorClass: Record<string, string> = {
    gray: "bg-slate-400",
    blue: "bg-blue-400",
    amber: "bg-amber-400",
    purple: "bg-purple-400",
    emerald: "bg-emerald-400",
    red: "bg-red-400",
    green: "bg-green-400",
    yellow: "bg-yellow-400",
};

const assigneeColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-red-500", "bg-cyan-500"];

function getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error !== "object" || error === null) return fallback;
    const maybeResponse = (error as { response?: { data?: { error?: string } } }).response;
    return maybeResponse?.data?.error || fallback;
}

function toDateInput(value?: string): string {
    return value ? value.slice(0, 10) : "";
}

function toApiDate(value: string): string | undefined {
    return value ? `${value}T00:00:00Z` : undefined;
}

function mapApiTimeEntries(entries?: ApiTimeEntry[]): TimeEntry[] {
    if (!entries) return [];
    return entries.map((entry) => ({
        id: entry.id ? String(entry.id) : undefined,
        date: toDateInput(entry.entry_date),
        time: minutesToTime(entry.minutes_spent),
    }));
}

function toApiTimeEntries(entries: TimeEntry[]): ApiTimeEntry[] {
    return entries
        .filter((entry) => entry.date && entry.time)
        .map((entry) => ({
            entry_date: entry.date,
            minutes_spent: timeToMinutes(entry.time),
        }));
}

function initials(name: string): string {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || "U").slice(0, 2).toUpperCase();
}

function dueLabel(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Due Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Due Tomorrow";
    return `Due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dayDiffFromToday(value?: string): number | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function timeToMinutes(value: string): number {
    const parts = value.split(":");
    if (parts.length !== 2) return 0;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
    return Math.max(hours, 0) * 60 + Math.max(minutes, 0);
}

function minutesToTime(totalMinutes: number): string {
    const normalized = Math.max(Math.floor(totalMinutes), 0);
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

interface TaskDraft {
    id?: string;
    title: string;
    description: string;
    column_key: string;
    priority: Priority;
    due_date: string;
    tags: string[];
    assignees: string[];
    watchers: string[];
    owner_id?: string | null;
    story_points?: number | null;
    checklist: ChecklistItem[];
    files: TaskFileRef[];
}

function emptyDraft(column = "backlog"): TaskDraft {
    return { title: "", description: "", column_key: column, priority: "MEDIUM", due_date: "", tags: [], assignees: [], watchers: [], owner_id: null, story_points: null, checklist: [], files: [] };
}

export default function KanbanPage({ initialProjectId = null }: { initialProjectId?: string | null } = {}) {
    const [columns, setColumns] = useState<Column[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [teamId, setTeamId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string | null>(initialProjectId);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterMode>("all");
    const [search, setSearch] = useState("");
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");
    const [projectForm, setProjectForm] = useState({ name: "", description: "", icon: "" });
    const [projectSaving, setProjectSaving] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskMode, setTaskMode] = useState<"create" | "edit">("create");
    const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyDraft());
    const [isTaskSaving, setIsTaskSaving] = useState(false);
    const [isTaskHydrating, setIsTaskHydrating] = useState(false);
    const [taskSubmitError, setTaskSubmitError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState("");
    const [checklistError, setChecklistError] = useState("");
    const [timeEntryError, setTimeEntryError] = useState("");
    const [customTag, setCustomTag] = useState("");
    const [checklistInput, setChecklistInput] = useState("");
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [timeEntryDate, setTimeEntryDate] = useState("");
    const [timeEntryValue, setTimeEntryValue] = useState("");
    const [shouldMigrateLocalTime, setShouldMigrateLocalTime] = useState(false);
    const [columnModalOpen, setColumnModalOpen] = useState(false);
    const [columnTitle, setColumnTitle] = useState("");
    const [columnColor, setColumnColor] = useState("gray");
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; action: (() => void | Promise<void>) | null }>({
        open: false,
        title: "",
        message: "",
        action: null,
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const toastTimerRef = useRef<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const authHeaders = useCallback((overrideTeamId?: string | null) => {
        const headers: Record<string, string> = {};
        const nextTeamId = overrideTeamId ?? teamId;
        if (nextTeamId) headers["X-Team-ID"] = String(nextTeamId);
        return headers;
    }, [teamId]);

    const { setHeaderTitle, setHeaderDescription } = useUI();

    const showToast = (message: string, type: ToastType = "success") => {
        setToast({ message, type });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
    };

    const clearTaskErrors = () => {
        setTaskSubmitError(null);
        setTitleError("");
        setChecklistError("");
        setTimeEntryError("");
    };

    const openCreateProjectModal = () => {
        setProjectModalMode("create");
        setProjectForm({ name: "", description: "", icon: "" });
        setProjectModalOpen(true);
    };



    const assignableMembers = useMemo(() => {
        if (!currentUserId) return members;
        if (members.some((member) => member.user_id === currentUserId)) return members;
        return [{ user_id: currentUserId, name: "Me", email: "me@local" }, ...members];
    }, [members, currentUserId]);

    const memberMap = useMemo(() => new Map(assignableMembers.map((m) => [m.user_id, m])), [assignableMembers]);

    const fetchBoard = useCallback(async (nextProjectId: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/projects/${nextProjectId}/board`, { headers: authHeaders() });
            const cleanColumns = (response.data?.data?.columns || []).map((col: Column) => ({
                ...col,
                tasks: col.tasks || []
            }));
            setColumns(cleanColumns);
            setError(null);

        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, "Failed to load board"));
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        let mounted = true;

        const bootstrap = async () => {


            const storedProjectId = localStorage.getItem(STORAGE_PROJECT);
            const preferredProjectId = initialProjectId || storedProjectId || null;
            if (preferredProjectId) {
                setProjectId(preferredProjectId);
            }

            try {
                const meResponse = await api.get("/me", { headers: authHeaders() });
                const nextUserId = String(meResponse.data?.data?.user_id || "");
                if (mounted && nextUserId) {
                    setCurrentUserId(nextUserId);
                }
            } catch {
                // Keep UI usable if /me is unavailable.
            }

            try {
                const teamResponse = await api.get("/teams", { headers: authHeaders() });
                const teams = teamResponse.data?.data || [];
                if (teams.length > 0) {
                    const nextTeamId = String(teams[0].id);
                    if (mounted) setTeamId(nextTeamId);

                    const [projectsResponse, membersResponse] = await Promise.all([
                        api.get(`/teams/${nextTeamId}/projects`, { headers: authHeaders(nextTeamId) }),
                        api.get(`/teams/${nextTeamId}/members`, { headers: authHeaders(nextTeamId) }),
                    ]);
                    if (!mounted) return;
                    const nextProjects: Project[] = projectsResponse.data?.data || [];
                    setProjects(nextProjects);
                    setMembers(membersResponse.data?.data || []);
                    if (!preferredProjectId && nextProjects.length > 0) {
                        setProjectId(nextProjects[0].id);
                    }
                } else {
                    const projectsResponse = await api.get("/projects", { headers: authHeaders() });
                    if (!mounted) return;
                    const nextProjects: Project[] = projectsResponse.data?.data || [];
                    setProjects(nextProjects);
                    if (!preferredProjectId && nextProjects.length > 0) {
                        setProjectId(nextProjects[0].id);
                    }
                }
            } catch (requestError: unknown) {
                if (mounted) {
                    setError(getErrorMessage(requestError, "Failed to load projects"));
                    setLoading(false);
                }
            }
        };

        void bootstrap();
        return () => {
            mounted = false;
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        };
    }, [initialProjectId, authHeaders]);

    useEffect(() => {
        if (!projectId) return;
        localStorage.setItem(STORAGE_PROJECT, String(projectId));
        void fetchBoard(projectId);
    }, [projectId, fetchBoard]);

    const filteredColumns = useMemo(() => {
        const query = search.trim().toLowerCase();
        return columns.map((column) => {
            const tasks = (column.tasks || []).filter((task) => {
                const matchesFilter = filter === "all"
                    ? true
                    : filter === "mine"
                        ? currentUserId
                            ? (task.assignees || []).includes(currentUserId)
                            : false
                        : task.priority === "HIGH" || task.priority === "URGENT";
                const title = (task.title || "").toLowerCase();
                const description = (task.description || "").toLowerCase();
                const idTag = `#${task.id}`;
                const tags = (task.tags || []).map(t => t.toLowerCase());

                const matchesSearch = !query ||
                    title.includes(query) ||
                    description.includes(query) ||
                    idTag.includes(query) ||
                    task.id === query ||
                    tags.some(t => t.includes(query));

                return matchesFilter && matchesSearch;
            });
            return { ...column, tasks };
        });
    }, [columns, currentUserId, filter, search]);

    const columnCounts = useMemo(() => {
        const counts = new Map<string, number>();
        columns.forEach((column) => counts.set(column.key, (column.tasks || []).length));
        return counts;
    }, [columns]);


    const noProject = !projectId;
    const selectedProject = useMemo(
        () => projects.find((project) => project.id === projectId),
        [projects, projectId]
    );
    const openEditProjectModal = () => {
        if (!selectedProject) return;
        setProjectModalMode("edit");
        setProjectForm({
            name: selectedProject.name || "",
            description: selectedProject.description || "",
            icon: "",
        });
        setProjectModalOpen(true);
    };
    const trackedTotalTime = useMemo(
        () => minutesToTime(timeEntries.reduce((sum, entry) => sum + timeToMinutes(entry.time), 0)),
        [timeEntries]
    );
    const boardTasks = useMemo(
        () => columns.flatMap((column) => (column.tasks || []).map((task) => ({ ...task, columnTitle: column.title, columnKey: column.key }))),
        [columns]
    );
    const myTasks = useMemo(
        () => boardTasks.filter((task) => currentUserId ? (task.assignees || []).includes(currentUserId) : false).length,
        [boardTasks, currentUserId]
    );
    const overdueTasks = useMemo(
        () => boardTasks.filter((task) => {
            const diff = dayDiffFromToday(task.due_date);
            return diff !== null && diff < 0;
        }),
        [boardTasks]
    );
    const dueSoonTasks = useMemo(
        () => boardTasks.filter((task) => {
            const diff = dayDiffFromToday(task.due_date);
            return diff !== null && diff >= 0 && diff <= 2;
        }),
        [boardTasks]
    );
    const unassignedUrgentTasks = useMemo(
        () => boardTasks.filter((task) => {
            const hasAssignee = (task.assignees || []).length > 0 || Boolean(task.owner_id);
            return !hasAssignee && (task.priority === "HIGH" || task.priority === "URGENT");
        }),
        [boardTasks]
    );
    const ownerGapTasks = useMemo(
        () => boardTasks.filter((task) => !task.owner_id),
        [boardTasks]
    );
    const noDueDateTasks = useMemo(
        () => boardTasks.filter((task) => !task.due_date),
        [boardTasks]
    );
    const reviewColumn = useMemo(
        () => columns.find((column) => {
            const key = column.key.toLowerCase();
            return key.includes("review");
        }),
        [columns]
    );
    const busiestColumn = useMemo(
        () => columns.reduce<Column | null>((current, column) => {
            if (!current) return column;
            return (column.tasks?.length || 0) > (current.tasks?.length || 0) ? column : current;
        }, null),
        [columns]
    );
    const atRiskCount = overdueTasks.length + unassignedUrgentTasks.length;
    const focusTodayCount = dueSoonTasks.length;
    const flowPressureCount = reviewColumn?.tasks?.length || busiestColumn?.tasks?.length || 0;
    const atRiskSummary = overdueTasks.length > 0 || unassignedUrgentTasks.length > 0
        ? `${overdueTasks.length} overdue, ${unassignedUrgentTasks.length} urgent without coverage`
        : "No overdue or uncovered urgent tasks";
    const focusTodaySummary = focusTodayCount > 0
        ? `${focusTodayCount} tasks due today, tomorrow, or within 48 hours`
        : "Nothing due in the next 48 hours";
    const flowPressureSummary = reviewColumn
        ? `${reviewColumn.title} is carrying the heaviest review load`
        : busiestColumn
            ? `${busiestColumn.title} has the heaviest load`
            : "No active stages yet";
    const noDueDateSummary = noDueDateTasks.length > 0
        ? `${noDueDateTasks.length} tasks are still missing a delivery target`
        : "Every task has a due date";
    const myTasksSummary = myTasks > 0
        ? `${myTasks} tasks are currently assigned to you`
        : "Nothing is assigned to you right now";
    useEffect(() => {
        setHeaderTitle(selectedProject?.name || "Project Kanban");
        setHeaderDescription(selectedProject?.description || "Manage tasks across stages with clear focus");
        return () => {
            setHeaderTitle("");
            setHeaderDescription("");
        };
    }, [selectedProject?.name, selectedProject?.description, setHeaderTitle, setHeaderDescription]);

    const openTaskModal = async (mode: "create" | "edit", task?: Task, columnKey?: string) => {
        setTaskMode(mode);
        clearTaskErrors();
        if (mode === "edit" && task) {
            setTaskDraft({
                id: task.id,
                title: task.title || "",
                description: task.description || "",
                column_key: task.column_key || "backlog",
                priority: task.priority || "MEDIUM",
                due_date: toDateInput(task.due_date),
                tags: [...(task.tags || [])],
                assignees: [...(task.assignees || [])],
                watchers: [...(task.watchers || task.assignees || [])],
                owner_id: task.owner_id ?? null,
                story_points: task.story_points ?? null,
                checklist: [...(task.subtasks || task.checklist || [])],
                files: [...(task.files || [])],
            });
            setTimeEntries(mapApiTimeEntries(task.time_entries));
            setShouldMigrateLocalTime(false);
            setIsTaskHydrating(true);
            setTaskModalOpen(true);
            try {
                const response = await api.get(`/tasks/${task.id}`, { headers: authHeaders() });
                const detailedTask = response.data?.data as Task | undefined;
                if (detailedTask) {
                    setTaskDraft({
                        id: detailedTask.id,
                        title: detailedTask.title || "",
                        description: detailedTask.description || "",
                        column_key: detailedTask.column_key || task.column_key || "backlog",
                        priority: detailedTask.priority || task.priority || "MEDIUM",
                        due_date: toDateInput(detailedTask.due_date),
                        tags: [...(detailedTask.tags || [])],
                        assignees: [...(detailedTask.assignees || [])],
                        watchers: [...(detailedTask.watchers || detailedTask.assignees || [])],
                        owner_id: detailedTask.owner_id ?? null,
                        story_points: detailedTask.story_points ?? null,
                        checklist: [...(detailedTask.subtasks || detailedTask.checklist || [])],
                        files: [...(detailedTask.files || [])],
                    });
                    const mappedEntries = mapApiTimeEntries(detailedTask.time_entries);
                    if (mappedEntries.length > 0) {
                        setTimeEntries(mappedEntries);
                    } else {
                        const migrationKey = `${TASK_TIME_MIGRATED_PREFIX}${task.id}`;
                        const migrated = localStorage.getItem(migrationKey) === "1";
                        if (!migrated) {
                            try {
                                const saved = localStorage.getItem(`${STORAGE_TIME_PREFIX}${task.id}`);
                                const parsed = saved ? (JSON.parse(saved) as TimeEntry[]) : [];
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    setTimeEntries(parsed);
                                    setShouldMigrateLocalTime(true);
                                }
                            } catch {
                                // ignore invalid legacy local data
                            }
                        }
                    }
                }
            } catch {
                // Use already-available board task data.
            } finally {
                setIsTaskHydrating(false);
            }
        } else {
            setTaskDraft(emptyDraft(columnKey || "backlog"));
            setTimeEntries([]);
            setShouldMigrateLocalTime(false);
            setTaskModalOpen(true);
        }
        setTimeEntryDate("");
        setTimeEntryValue("");
        setCustomTag("");
        setChecklistInput("");
    };

    const addTimeEntry = () => {
        if (!timeEntryDate || !timeEntryValue) {
            setTimeEntryError("Both date and time are required");
            return;
        }
        setTimeEntryError("");
        setTimeEntries((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                date: timeEntryDate,
                time: timeEntryValue,
            },
        ]);
        setTimeEntryDate("");
        setTimeEntryValue("");
    };

    const removeTimeEntry = (id: string) => {
        setTimeEntries((prev) => prev.filter((entry) => entry.id !== id));
    };

    const toggleTag = (tag: string) => {
        setTaskDraft((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag],
        }));
    };

    const addCustomTag = () => {
        const value = customTag.trim().toLowerCase();
        if (!value) return;
        setTaskDraft((prev) => ({ ...prev, tags: prev.tags.includes(value) ? prev.tags : [...prev.tags, value] }));
        setCustomTag("");
    };

    const toggleWatcher = (userId: string) => {
        setTaskDraft((prev) => ({
            ...prev,
            watchers: prev.watchers.includes(userId) ? prev.watchers.filter((id) => id !== userId) : [...prev.watchers, userId],
            assignees: prev.assignees.includes(userId) ? prev.assignees.filter((id) => id !== userId) : [...prev.assignees, userId],
        }));
    };

    const addChecklistItem = (value: string) => {
        const text = value.trim();
        if (!text) {
            setChecklistError("Checklist items cannot be empty");
            return;
        }
        setChecklistError("");
        setTaskDraft((prev) => ({
            ...prev,
            checklist: [...prev.checklist, { text, position: prev.checklist.length, completed: false }],
        }));
    };

    const removeChecklistItem = (index: number) => {
        setTaskDraft((prev) => ({
            ...prev,
            checklist: prev.checklist.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i })),
        }));
    };

    const uploadAndAttachFile = async (file: File) => {
        void file;
        showToast("Task file attachments are not supported by the backend yet", "warning");
    };

    const unlinkTaskFile = async (fileID: number) => {
        void fileID;
        showToast("Task file attachments are not supported by the backend yet", "warning");
    };

    const saveTask = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!projectId || isTaskSaving) return;
        clearTaskErrors();

        const parsed = taskSchema.safeParse({
            title: taskDraft.title,
            column_key: taskDraft.column_key,
            priority: taskDraft.priority,
            due_date: taskDraft.due_date || undefined,
            checklist: taskDraft.checklist.map((item) => ({ text: item.text, completed: Boolean(item.completed) })),
            story_points: taskDraft.story_points ?? null,
        });
        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                if (issue.path[0] === "title") setTitleError(issue.message);
                if (issue.path[0] === "checklist") setChecklistError(issue.message);
            }
            showToast("Please fix the validation errors", "error");
            return;
        }
        if (timeEntries.some((entry) => !entry.date || !entry.time)) {
            setTimeEntryError("Every time entry requires date and time");
            showToast("Please fix the time entry validation errors", "error");
            return;
        }

        const payload = {
            title: taskDraft.title.trim(),
            description: taskDraft.description,
            column_key: taskDraft.column_key,
            priority: taskDraft.priority,
            due_date: taskDraft.due_date ? toApiDate(taskDraft.due_date) : null,
            owner_id: taskDraft.owner_id ?? null,
            watchers: taskDraft.watchers,
            tags: taskDraft.tags,
            assignees: taskDraft.assignees,
            story_points: taskDraft.story_points ?? null,
            subtasks: taskDraft.checklist.map((item, index) => ({
                id: item.id,
                text: item.text,
                position: index,
                completed: Boolean(item.completed),
                completed_at: item.completed ? item.completed_at || new Date().toISOString() : undefined,
            })),
            checklist: taskDraft.checklist.map((item, index) => ({
                id: item.id,
                text: item.text,
                position: index,
                completed: Boolean(item.completed),
                completed_at: item.completed ? item.completed_at || new Date().toISOString() : undefined,
            })),
            file_ids: (taskDraft.files || []).map((f) => f.file_id),
            time_entries: toApiTimeEntries(timeEntries),
        };

        try {
            setIsTaskSaving(true);
            if (taskMode === "create") {
                const response = await api.post(`/projects/${projectId}/tasks`, payload, { headers: authHeaders() });
                const created = response.data?.data as Task | undefined;
                const createdID = String(created?.id || "");
                if (!createdID) throw new Error("Task created without id");
                setTaskMode("edit");
                setTaskDraft((prev) => ({ ...prev, id: createdID }));
                showToast("Task created. Continue with additional info.", "success");
                await fetchBoard(projectId);
                setIsTaskHydrating(true);
                try {
                    const detailed = await api.get(`/tasks/${createdID}`, { headers: authHeaders() });
                    const task = detailed.data?.data as Task | undefined;
                    if (task) {
                        setTaskDraft({
                            id: task.id,
                            title: task.title || "",
                            description: task.description || "",
                            column_key: task.column_key || "backlog",
                            priority: task.priority || "MEDIUM",
                            due_date: toDateInput(task.due_date),
                            tags: [...(task.tags || [])],
                            assignees: [...(task.assignees || [])],
                            watchers: [...(task.watchers || task.assignees || [])],
                            owner_id: task.owner_id ?? null,
                            story_points: task.story_points ?? null,
                            checklist: [...(task.subtasks || task.checklist || [])],
                            files: [...(task.files || [])],
                        });
                    }
                } finally {
                    setIsTaskHydrating(false);
                }
                return;
            } else if (taskDraft.id) {
                await api.put(`/tasks/${taskDraft.id}`, payload, { headers: authHeaders() });
                showToast("Task updated successfully", "success");
            }
            if (taskDraft.id && shouldMigrateLocalTime) {
                localStorage.setItem(`${TASK_TIME_MIGRATED_PREFIX}${taskDraft.id}`, "1");
                localStorage.removeItem(`${STORAGE_TIME_PREFIX}${taskDraft.id}`);
            }
            setTaskModalOpen(false);
            await fetchBoard(projectId);
        } catch (requestError: unknown) {
            const message = getErrorMessage(requestError, "Failed to save task");
            setTaskSubmitError(message);
            showToast(message, "error");
        } finally {
            setIsTaskSaving(false);
        }
    };

    const saveProject = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = projectForm.name.trim();
        if (!name || projectSaving) return;

        try {
            setProjectSaving(true);
            if (projectModalMode === "edit" && projectId) {
                const response = await api.put(`/projects/${projectId}`, {
                    name,
                    description: projectForm.description.trim(),
                    icon: projectForm.icon.trim(),
                }, { headers: authHeaders() });
                const updated = response.data?.data as Project | undefined;
                if (!updated?.id) {
                    throw new Error("Project updated without id");
                }
                setProjects((prev) => prev.map((project) => project.id === updated.id ? { ...project, ...updated } : project));
                setProjectId(updated.id);
                setProjectModalOpen(false);
                setProjectForm({ name: "", description: "", icon: "" });
                showToast(`Project "${updated.name}" updated`, "success");
                return;
            }

            const response = await api.post("/projects", {
                name,
                description: projectForm.description.trim(),
                icon: projectForm.icon.trim(),
            }, { headers: authHeaders() });
            const created = response.data?.data as Project | undefined;
            if (!created?.id) {
                throw new Error("Project created without id");
            }
            setProjects((prev) => [...prev, created]);
            setProjectId(created.id);
            setProjectModalOpen(false);
            setProjectForm({ name: "", description: "", icon: "" });
            showToast(`Project "${created.name}" created`, "success");
        } catch (requestError: unknown) {
            showToast(getErrorMessage(requestError, projectModalMode === "edit" ? "Failed to update project" : "Failed to create project"), "error");
        } finally {
            setProjectSaving(false);
        }
    };

    const confirmDeleteTask = (taskId?: string) => {
        const id = taskId || taskDraft.id;
        if (!id || !projectId || isTaskSaving) return;

        setConfirm({
            open: true,
            title: "Delete Task",
            message: "Are you sure you want to delete this task? This action cannot be undone.",
            action: async () => {
                try {
                    await api.delete(`/tasks/${id}`, { headers: authHeaders() });
                    showToast("Task deleted", "success");
                    setTaskModalOpen(false);
                    await fetchBoard(projectId);
                } catch (error) {
                    showToast(getErrorMessage(error, "Failed to delete task"), "error");
                }
            },
        });
    };

    const moveTask = async (taskId: string, columnKey: string) => {
        try {
            await api.patch(`/tasks/${taskId}/move`, { column_key: columnKey }, { headers: authHeaders() });
            if (projectId) await fetchBoard(projectId);
            showToast("Task moved successfully", "success");
        } catch (requestError: unknown) {
            showToast(getErrorMessage(requestError, "Failed to move task"), "error");
        }
    };

    const saveColumn = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!projectId) return;
        const title = columnTitle.trim();
        if (!title) return;
        try {
            await api.post(`/projects/${projectId}/board/columns`, { title, color: columnColor }, { headers: authHeaders() });
            setColumnModalOpen(false);
            setColumnTitle("");
            setColumnColor("gray");
            await fetchBoard(projectId);
            showToast(`Column "${title}" created`, "success");
        } catch (requestError: unknown) {
            showToast(getErrorMessage(requestError, "Failed to create column"), "error");
        }
    };

    const confirmDeleteColumn = (column: Column) => {
        if (!projectId) return;
        const taskCount = columnCounts.get(column.key) || 0;
        setConfirm({
            open: true,
            title: "Delete Column",
            message: `Delete "${column.title}"? ${taskCount > 0 ? `${taskCount} task(s) will be moved to Backlog.` : "This action cannot be undone."}`,
            action: async () => {
                try {
                    await api.delete(`/projects/${projectId}/board/columns/${column.id}`, { headers: authHeaders() });
                    await fetchBoard(projectId);
                    showToast("Column deleted and tasks moved to Backlog", "success");
                } catch (requestError: unknown) {
                    showToast(getErrorMessage(requestError, "Failed to delete column"), "error");
                }
            },
        });
    };

    const runConfirm = async () => {
        if (!confirm.action) return;
        try {
            await confirm.action();
        } finally {
            setConfirm({ open: false, title: "", message: "", action: null });
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(String(active.id));
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);
        const isColumnTarget = columns.some((col) => col.key === overId);

        // Find the containers
        const activeColumn = columns.find(col => col.tasks.some(t => t.id === activeId));
        const overColumn = columns.find(col => col.key === overId) ||
            columns.find(col => col.tasks.some(t => t.id === overId));

        if (!activeColumn || !overColumn || activeColumn === overColumn) return;

        setColumns(prev => {
            const activeItems = activeColumn.tasks || [];
            const overItems = overColumn.tasks || [];
            const activeIndex = activeItems.findIndex(t => t.id === activeId);
            const overIndex = isColumnTarget ? -1 : overItems.findIndex(t => t.id === overId);

            let newIndex;
            if (!isColumnTarget) {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            } else {
                newIndex = overItems.length + 1;
            }

            return prev.map(c => {
                if (c.id === activeColumn.id) {
                    return { ...c, tasks: activeItems.filter(t => t.id !== activeId) };
                }
                if (c.id === overColumn.id) {
                    // Optimistic rendering: insert task into new column
                    const newTask = { ...activeItems[activeIndex], column_key: overColumn.key };
                    return {
                        ...c,
                        tasks: [
                            ...overItems.slice(0, newIndex),
                            newTask,
                            ...overItems.slice(newIndex, overItems.length),
                        ],
                    };
                }
                return c;
            });
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        const activeId = String(active.id);
        setActiveId(null);

        if (!over) return;

        const activeColumn = columns.find(col => col.tasks.some(t => t.id === activeId));
        const overId = String(over.id);
        const overColumn = columns.find(col => col.key === overId) ||
            columns.find(col => col.tasks.some(t => t.id === overId));

        if (activeColumn && overColumn && activeColumn.key !== overColumn.key) {
            // Task moved to different column (already handled optimistically in DragOver, but now we persist)
            // We need to verify the final position or just call the API.
            // Currently generic moveTask only supports updating columnKey, not position.
            // So we just call moveTask.
            void moveTask(activeId, overColumn.key);
        } else if (activeColumn && overColumn && activeColumn.key === overColumn.key) {
            // Reordering within same column
            const tasks = activeColumn.tasks || [];
            const activeIndex = tasks.findIndex(t => t.id === activeId);
            const overIndex = tasks.findIndex(t => t.id === overId);
            if (activeIndex !== overIndex) {
                setColumns((prev) => prev.map(col => {
                    if (col.id === activeColumn.id) {
                        return { ...col, tasks: arrayMove(col.tasks, activeIndex, overIndex) };
                    }
                    return col;
                }));
                // Note: no backend API for reordering yet, so this is local only.
            }
        }
    };

    // Derived active task for overlay
    const activeTask = useMemo(() => {
        if (!activeId) return null;
        for (const col of columns) {
            const task = col.tasks.find(t => t.id === activeId);
            if (task) return task;
        }
        return null;
    }, [activeId, columns]);



    useEffect(() => {
        const onEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (isTaskSaving) return;
            if (confirm.open) setConfirm({ open: false, title: "", message: "", action: null });
            if (columnModalOpen) setColumnModalOpen(false);
            if (taskModalOpen) setTaskModalOpen(false);
        };
        document.addEventListener("keydown", onEscape);
        return () => document.removeEventListener("keydown", onEscape);
    }, [confirm.open, columnModalOpen, taskModalOpen, isTaskSaving]);

    return (
        <>
            <DashboardCanvas className="kanban-page">
                <DashboardContent className="max-w-none">
                    <DashboardHero
                        size="compact"
                        className="p-3 md:p-4"
                        eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Kanban</>}
                        title={selectedProject?.name || "Delivery board with a calmer control-room feel"}
                        description={selectedProject?.description || "Manage stages, priorities, and execution in a cleaner board layout that matches the rest of the dashboard without extra motion noise."}
                    />

                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white/65 p-5 shadow-none">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                {([
                                    { key: "all", label: "All tasks", icon: LayoutGrid },
                                    { key: "mine", label: "Assigned to me", icon: User },
                                    { key: "high", label: "High priority", icon: Zap },
                                ] as const).map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.key}
                                            className={clsx(
                                                "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
                                                filter === item.key
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                            onClick={() => setFilter(item.key)}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </button>
                                    );
                                })}
                                <Button className="h-11 rounded-2xl px-4" onClick={() => openTaskModal("create")} disabled={noProject}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Task
                                </Button>
                            </div>

                            <div className="relative w-full xl:max-w-md">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="search-input"
                                    placeholder="Search by title, tag, description, or task ID"
                                    className="h-11 rounded-2xl border-slate-200 bg-white pl-11"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {noProject ? (
                        <div className="rounded-[24px] border border-slate-200 bg-white/65 p-5 shadow-none">
                            <DashboardEmpty
                                title="Select or create a project"
                                description="A project is required before the board can load stages and tasks."
                                action={
                                    <Button onClick={openCreateProjectModal}>
                                        <FolderPlus className="mr-2 h-4 w-4" />
                                        Create Project
                                    </Button>
                                }
                            />
                        </div>
                    ) : loading ? (
                        <div className="rounded-[24px] border border-slate-200 bg-white/65 p-8 text-sm text-slate-600 shadow-none">Loading board...</div>
                    ) : error ? (
                        <div className="rounded-[24px] border border-slate-200 bg-white/65 p-5 shadow-none">
                            <DashboardNotice tone="red">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <h3 className="font-semibold">We couldn&apos;t load this board</h3>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </DashboardNotice>
                        </div>
                    ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div id="kanban-board" className="kanban-board flex gap-5 overflow-x-auto pb-6 h-full items-start">
                            {filteredColumns.map((column) => (
                                <SortableColumn
                                    key={column.key}
                                    column={column}
                                    columnCounts={columnCounts}
                                    columnColorClass={columnColorClass}
                                    assigneeColors={assigneeColors}
                                    memberMap={memberMap}
                                    initials={initials}
                                    dueLabel={dueLabel}
                                    onTaskClick={(task) => openTaskModal("edit", task)}
                                    onDeleteColumn={confirmDeleteColumn}
                                    onAddTask={(columnKey) => openTaskModal("create", undefined, columnKey)}
                                    onDeleteTask={(task) => confirmDeleteTask(task.id)}
                                />
                            ))}
                            <div className="min-w-[290px] max-w-[290px] flex flex-col h-full">
                                <button className="add-column-btn flex min-h-[180px] items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white/70 p-4 transition-colors hover:border-emerald-300 hover:bg-white/90" onClick={() => setColumnModalOpen(true)}>
                                    <div className="text-center">
                                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Plus className="h-5 w-5" /></div>
                                        <p className="font-medium text-slate-800">Add New Column</p>
                                        <p className="mt-1 text-xs text-slate-500">Create a custom stage</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <DragOverlay>
                            {activeTask ? (
                                <TaskCard
                                    task={activeTask}
                                    assigneeColors={assigneeColors}
                                    memberMap={memberMap}
                                    initials={initials}
                                    dueLabel={dueLabel}
                                    isDragging
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                    )}
                </DashboardContent>
            </DashboardCanvas>

            <CreateTaskModal
                key={`create-${taskModalOpen}-${taskDraft.id ?? "new"}`}
                open={taskModalOpen && taskMode === "create"}
                onClose={() => setTaskModalOpen(false)}
                onSubmit={saveTask}
                taskDraft={taskDraft}
                setTaskDraft={setTaskDraft}
                tags={TAGS}
                customTag={customTag}
                setCustomTag={setCustomTag}
                toggleTag={toggleTag}
                addCustomTag={addCustomTag}
                columns={columns}
                members={assignableMembers}
                assigneeColors={assigneeColors}
                initials={initials}
                toggleWatcher={toggleWatcher}
                checklistInput={checklistInput}
                setChecklistInput={setChecklistInput}
                addChecklistItem={addChecklistItem}
                removeChecklistItem={removeChecklistItem}
                onUploadFile={uploadAndAttachFile}
                onRemoveFile={unlinkTaskFile}
                isSaving={isTaskSaving}
                titleError={titleError}
                checklistError={checklistError}
                submitError={taskSubmitError}
            />

            <EditTaskModal
                key={`edit-${taskModalOpen}-${taskDraft.id ?? "none"}`}
                open={taskModalOpen && taskMode === "edit"}
                onClose={() => setTaskModalOpen(false)}
                onSubmit={saveTask}
                onDelete={confirmDeleteTask}
                taskDraft={taskDraft}
                setTaskDraft={setTaskDraft}
                tags={TAGS}
                customTag={customTag}
                setCustomTag={setCustomTag}
                toggleTag={toggleTag}
                addCustomTag={addCustomTag}
                columns={columns}
                members={assignableMembers}
                assigneeColors={assigneeColors}
                initials={initials}
                toggleWatcher={toggleWatcher}
                checklistInput={checklistInput}
                setChecklistInput={setChecklistInput}
                addChecklistItem={addChecklistItem}
                removeChecklistItem={removeChecklistItem}
                onUploadFile={uploadAndAttachFile}
                onRemoveFile={unlinkTaskFile}
                timeEntries={timeEntries}
                timeEntryDate={timeEntryDate}
                setTimeEntryDate={setTimeEntryDate}
                timeEntryValue={timeEntryValue}
                setTimeEntryValue={setTimeEntryValue}
                addTimeEntry={addTimeEntry}
                removeTimeEntry={removeTimeEntry}
                totalTime={trackedTotalTime}
                isSaving={isTaskSaving}
                isHydrating={isTaskHydrating}
                titleError={titleError}
                checklistError={checklistError}
                timeEntryError={timeEntryError}
                submitError={taskSubmitError}
            />

            <NewColumnModal
                open={columnModalOpen}
                onClose={() => setColumnModalOpen(false)}
                onSubmit={saveColumn}
                columnTitle={columnTitle}
                setColumnTitle={setColumnTitle}
                columnColor={columnColor}
                setColumnColor={setColumnColor}
                columnColorClass={columnColorClass}
            />

            <div className={clsx("modal-backdrop", projectModalOpen && "active")} onClick={() => !projectSaving && setProjectModalOpen(false)}>
                <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
                    <form onSubmit={saveProject} className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{projectModalMode === "edit" ? "Edit Project" : "Create Project"}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{projectModalMode === "edit" ? "Update the current board without leaving Kanban." : "Start a new board without leaving Kanban."}</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                                onClick={() => setProjectModalOpen(false)}
                                disabled={projectSaving}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Project Name</label>
                                <input
                                    className="w-full rounded-lg border px-3 py-2"
                                    value={projectForm.name}
                                    onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Platform Revamp"
                                    required
                                    disabled={projectSaving}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full rounded-lg border px-3 py-2"
                                    rows={3}
                                    value={projectForm.description}
                                    onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="What this board is for"
                                    disabled={projectSaving}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Icon</label>
                                <input
                                    className="w-full rounded-lg border px-3 py-2"
                                    value={projectForm.icon}
                                    onChange={(e) => setProjectForm((prev) => ({ ...prev, icon: e.target.value }))}
                                    placeholder="fas fa-rocket"
                                    disabled={projectSaving}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                onClick={() => setProjectModalOpen(false)}
                                disabled={projectSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
                                disabled={projectSaving}
                            >
                                {projectSaving ? (projectModalMode === "edit" ? "Saving..." : "Creating...") : (projectModalMode === "edit" ? "Save Project" : "Create Project")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={clsx("modal-backdrop", confirm.open && "active")} onClick={() => setConfirm({ open: false, title: "", message: "", action: null })}>
                <div className="modal max-w-sm sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4"><i className="fas fa-exclamation-triangle text-red-500 text-xl" /></div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{confirm.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{confirm.message}</p>
                        <div className="flex gap-3 justify-center"><button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setConfirm({ open: false, title: "", message: "", action: null })}>Cancel</button><button className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm" onClick={() => void runConfirm()}>Delete</button></div>
                    </div>
                </div>
            </div>

            {toast && <div className={clsx("toast show", toast.type)}><i className={clsx("fas", toast.type === "success" ? "fa-check-circle" : toast.type === "error" ? "fa-exclamation-circle" : "fa-exclamation-triangle")} /><span>{toast.message}</span></div>}
        </>
    );
}


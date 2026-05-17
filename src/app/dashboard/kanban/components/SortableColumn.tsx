import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { CalendarDays, ChevronLeft, ChevronRight, Inbox, MessageCircle, Paperclip, PlusCircle, Sparkles, Trash2 } from "lucide-react";
import { Column, Task, TeamMember } from "../types";
import SortableTask from "./SortableTask";

function loadSignal(taskCount: number) {
    if (taskCount >= 8) {
        return {
            dotClass: "bg-red-500",
            badgeClass: "bg-red-100 text-red-700 border-red-200",
            label: "High",
        };
    }
    if (taskCount >= 4) {
        return {
            dotClass: "bg-amber-400",
            badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
            label: "Medium",
        };
    }
    return {
        dotClass: "bg-emerald-500",
        badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
        label: "Low",
    };
}

function priorityPreviewClass(task: Task) {
    if (task.priority === "URGENT") return "bg-red-500";
    if (task.priority === "HIGH") return "bg-amber-400";
    if (task.priority === "LOW") return "bg-sky-400";
    return "bg-emerald-400";
}

interface SortableColumnProps {
    column: Column;
    columnCounts: Map<string, number>;
    columnColorClass: Record<string, string>;
    assigneeColors: string[];
    memberMap: Map<string, TeamMember>;
    initials: (name: string) => string;
    dueLabel: (value?: string) => string;
    isMinimized: boolean;
    onToggleMinimize: (columnKey: string) => void;
    onTaskClick: (task: Task) => void;
    onDeleteColumn: (column: Column) => void;
    onAddTask: (columnKey: string) => void;
    onDeleteTask: (task: Task) => void;
}

export default function SortableColumn({
    column,
    columnCounts,
    columnColorClass,
    assigneeColors,
    memberMap,
    initials,
    dueLabel,
    isMinimized,
    onToggleMinimize,
    onTaskClick,
    onDeleteColumn,
    onAddTask,
    onDeleteTask,
}: SortableColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.key,
        data: { type: "Column", column },
    });
    const taskCount = columnCounts.get(column.key) || 0;
    const signal = loadSignal(taskCount);
    const previewTask = column.tasks[0];
    const remainingTasks = column.tasks.slice(1, 4);

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "kanban-col group flex self-stretch flex-col overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/82 shadow-[0_18px_44px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-200",
                isMinimized ? "kanban-col-minimized min-w-[132px] max-w-[132px]" : "min-w-[310px] max-w-[310px]"
            )}
        >
            <div className={clsx("column-header sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 font-medium", isMinimized ? "flex flex-col gap-3 px-3 py-3.5" : "flex items-center justify-between p-4")}>
                {isMinimized ? (
                    <>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className={clsx("h-3 w-3 shrink-0 rounded-full border-2 border-white shadow-sm", columnColorClass[column.color] || "bg-slate-400")} />
                                <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    {column.title}
                                </span>
                            </div>
                            <button
                                className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                onClick={() => onToggleMinimize(column.key)}
                                title="Expand Column"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <span className="text-[1.7rem] font-semibold leading-none text-slate-900">
                                    {taskCount}
                                </span>
                                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    active cards
                                </span>
                            </div>
                            <span
                                className={clsx(
                                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]",
                                    signal.badgeClass
                                )}
                                title={`Column load: ${signal.label}`}
                            >
                                <span className={clsx("h-1.5 w-1.5 rounded-full", signal.dotClass)} />
                                {signal.label}
                            </span>
                        </div>

                        {column.key !== "todo" ? (
                            <button
                                className="self-end rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                                onClick={() => onDeleteColumn(column)}
                                title="Delete Column"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <span className={clsx("h-3 w-3 rounded-full border-2 border-white shadow-sm", columnColorClass[column.color] || "bg-slate-400")} />
                            <span className="font-semibold text-slate-900">{column.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
                                {taskCount}
                            </span>
                            <span
                                className={clsx(
                                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]",
                                    signal.badgeClass
                                )}
                                title={`Column load: ${signal.label}`}
                            >
                                <span className={clsx("h-1.5 w-1.5 rounded-full", signal.dotClass)} />
                                {signal.label}
                            </span>
                            <button
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                onClick={() => onToggleMinimize(column.key)}
                                title="Minimize Column"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            {column.key !== "todo" && (
                                <button
                                    className="rounded p-1 text-slate-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-slate-100 hover:text-red-500"
                                    onClick={() => onDeleteColumn(column)}
                                    title="Delete Column"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className={clsx("flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.55),rgba(255,255,255,0.2))]", isMinimized ? "h-[420px] px-2 py-2.5" : "min-h-[420px] space-y-3 p-3")}>
                <SortableContext
                    items={column.tasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {isMinimized ? (
                        <div className="flex h-full min-h-0 flex-col gap-2 rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.86))] p-2">
                            <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                                <span>{taskCount === 0 ? "Empty lane" : "Flow snapshot"}</span>
                                <Sparkles className="h-3.5 w-3.5 text-slate-300" />
                            </div>

                            <div className="flex flex-1 flex-col gap-2">
                                {previewTask ? (
                                    <button
                                        key={previewTask.id}
                                        type="button"
                                        onClick={() => onTaskClick(previewTask)}
                                        className="rounded-[18px] border border-slate-200 bg-white/95 p-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-white"
                                        title={previewTask.title}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                                        #{previewTask.id}
                                                    </div>
                                                    <div className="mt-1 line-clamp-3 text-[12px] font-semibold leading-4 text-slate-800">
                                                        {previewTask.title}
                                                    </div>
                                                </div>
                                                <span className={clsx("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", priorityPreviewClass(previewTask))} />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                                    {previewTask.priority}
                                                </span>
                                                {previewTask.due_date ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {dueLabel(previewTask.due_date)}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="line-clamp-3 min-h-[44px] text-[10px] leading-4 text-slate-500">
                                                {previewTask.description || "No description yet."}
                                            </div>

                                            <div className="flex items-center justify-between gap-2 text-[9px] font-medium text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3" />
                                                        {previewTask.comments || 0}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Paperclip className="h-3 w-3" />
                                                        {previewTask.attachments || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center -space-x-1">
                                                    {(previewTask.assignees || []).slice(0, 3).map((id, index) => (
                                                        <div
                                                            key={id}
                                                            className={clsx(
                                                                "flex h-5 w-5 items-center justify-center rounded-full border border-white text-[8px] font-semibold text-white shadow-sm",
                                                                assigneeColors[index % assigneeColors.length]
                                                            )}
                                                            title={memberMap.get(id)?.name || `User ${id}`}
                                                        >
                                                            {initials(memberMap.get(id)?.name || `U${id}`)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="flex h-full min-h-[196px] flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-slate-200 bg-white/60 px-2 py-4 text-slate-400">
                                        <Inbox className="h-5 w-5 opacity-50" />
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                                            No tasks
                                        </span>
                                    </div>
                                )}

                                {remainingTasks.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {remainingTasks.map((task) => (
                                            <button
                                                key={task.id}
                                                type="button"
                                                onClick={() => onTaskClick(task)}
                                                className="flex w-full items-center gap-2 rounded-[14px] border border-slate-200/80 bg-white/80 px-2 py-2 text-left transition hover:border-slate-300 hover:bg-white"
                                                title={task.title}
                                            >
                                                <span className={clsx("h-2 w-2 shrink-0 rounded-full", priorityPreviewClass(task))} />
                                                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-600">
                                                    {task.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            {taskCount > 4 ? (
                                <div className="rounded-2xl bg-slate-900 px-2 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                                    +{taskCount - 4} more cards
                                </div>
                            ) : taskCount > 1 ? (
                                <div className="rounded-2xl bg-slate-100 px-2 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                                    {taskCount - 1} waiting behind lead card
                                </div>
                            ) : null}
                        </div>
                    ) : column.tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-white/70 p-8 text-slate-400">
                            <Inbox className="mb-2 h-7 w-7 opacity-50" />
                            <p className="text-sm font-medium">No tasks yet</p>
                            <p className="mt-1 text-xs opacity-70">Drop a task here</p>
                        </div>
                    ) : (
                        column.tasks.map((task) => (
                            <SortableTask
                                key={task.id}
                                task={task}
                                assigneeColors={assigneeColors}
                                memberMap={memberMap}
                                initials={initials}
                                dueLabel={dueLabel}
                                onClick={onTaskClick}
                                onDelete={onDeleteTask}
                            />
                        ))
                    )}
                </SortableContext>
            </div>

            {!isMinimized ? (
                <div className="rounded-b-[26px] border-t border-slate-200/80 bg-white/60 p-2">
                    <button
                        className="flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-sm font-medium text-slate-600 transition-all hover:bg-white hover:text-emerald-700 hover:shadow-sm"
                        onClick={() => onAddTask(column.key)}
                    >
                        <PlusCircle className="h-4 w-4" /> Add task
                    </button>
                </div>
            ) : null}
        </div>
    );
}

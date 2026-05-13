import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Inbox, PlusCircle, Trash2 } from "lucide-react";
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
    const previewTasks = column.tasks.slice(0, 3);

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "kanban-col group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/82 shadow-[0_18px_44px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-200",
                isMinimized ? "min-w-[112px] max-w-[112px]" : "min-w-[310px] max-w-[310px]"
            )}
        >
            <div className={clsx("column-header sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 p-4 font-medium", isMinimized ? "flex flex-col items-center gap-3" : "flex items-center justify-between")}>
                <div className={clsx("flex items-center gap-2", isMinimized && "flex-col")}>
                    <span className={clsx("h-3 w-3 rounded-full border-2 border-white shadow-sm", columnColorClass[column.color] || "bg-slate-400")} />
                    <span className={clsx("font-semibold text-slate-900", isMinimized && "text-center text-xs [writing-mode:vertical-rl] rotate-180")}>{column.title}</span>
                </div>
                <div className={clsx("flex items-center gap-2", isMinimized && "flex-col")}>
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
                        {isMinimized ? signal.label[0] : signal.label}
                    </span>
                    <button
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => onToggleMinimize(column.key)}
                        title={isMinimized ? "Expand Column" : "Minimize Column"}
                    >
                        {isMinimized ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
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
            </div>

            <div className={clsx("flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.55),rgba(255,255,255,0.2))]", isMinimized ? "h-[420px] px-2 py-3" : "min-h-[420px] space-y-3 p-3")}>
                <SortableContext
                    items={column.tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {isMinimized ? (
                        <div className="flex h-full min-h-0 flex-col gap-2 rounded-[20px] border border-slate-200 bg-white/72 p-2">
                            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                                {taskCount === 0 ? "Empty" : `Top ${Math.min(taskCount, 3)}`}
                            </div>
                            <div className="flex flex-1 flex-col gap-2">
                                {previewTasks.length > 0 ? previewTasks.map((task) => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => onTaskClick(task)}
                                        className="flex min-h-[84px] flex-1 flex-col rounded-[16px] border border-slate-200 bg-white px-2 py-2 text-left shadow-[0_8px_16px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50"
                                        title={task.title}
                                    >
                                        <div className="mb-1 flex items-center justify-between gap-1">
                                            <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                                #{task.id}
                                            </span>
                                            <span className={clsx("h-2 w-2 rounded-full", priorityPreviewClass(task))} />
                                        </div>
                                        <span className="line-clamp-3 text-[11px] font-semibold leading-4 text-slate-700">
                                            {task.title}
                                        </span>
                                    </button>
                                )) : (
                                    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-slate-200 bg-white/60 px-2 py-4 text-slate-400">
                                        <Inbox className="h-5 w-5 opacity-50" />
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                                            No tasks
                                        </span>
                                    </div>
                                )}
                                {previewTasks.length < 3 && previewTasks.length > 0
                                    ? Array.from({ length: 3 - previewTasks.length }).map((_, index) => (
                                        <div
                                            key={`empty-preview-${index}`}
                                            className="min-h-[84px] flex-1 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70"
                                        />
                                    ))
                                    : null}
                            </div>
                            {taskCount > 3 ? (
                                <div className="rounded-2xl bg-slate-900 px-2 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                                    +{taskCount - 3} more
                                </div>
                            ) : null}
                        </div>
                    ) : column.tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-white/70 p-8 text-slate-400">
                            <Inbox className="mb-2 h-7 w-7 opacity-50" />
                            <p className="text-sm font-medium">No tasks yet</p>
                            <p className="text-xs opacity-70 mt-1">Drop a task here</p>
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

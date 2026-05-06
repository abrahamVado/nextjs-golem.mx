import clsx from "clsx";
import { CalendarDays, MessageCircle, Paperclip, Trash2 } from "lucide-react";
import { Task, TeamMember } from "../types";

interface TaskCardProps {
    task: Task;
    assigneeColors: string[];
    memberMap: Map<string, TeamMember>;
    initials: (name: string) => string;
    dueLabel: (value?: string) => string;
    onClick?: () => void;
    isDragging?: boolean;
    style?: React.CSSProperties;
    onDelete?: (e: React.MouseEvent) => void;
}

export default function TaskCard({
    task,
    assigneeColors,
    memberMap,
    initials,
    dueLabel,
    onClick,
    isDragging,
    style,
    onDelete,
}: TaskCardProps) {
    return (
        <div
            className={clsx(
                "task-card group/card relative rounded-[20px] border border-slate-200 bg-white/96 p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition",
                task.priority === "URGENT" ? "priority-critical" :
                    task.priority === "HIGH" ? "priority-high" :
                        task.priority === "LOW" ? "priority-low" : "priority-medium",
                isDragging ? "dragging rotate-2 cursor-grabbing ring-2 ring-emerald-400 opacity-90 shadow-2xl" : "cursor-grab"
            )}
            onClick={onClick}
            style={style}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 pr-6">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">#{task.id}</p>
                    <p className="truncate font-semibold text-slate-900">{task.title}</p>
                    <p className="line-clamp-2 text-sm text-slate-500">{task.description}</p>
                </div>
                {onDelete && (
                    <button
                        className="absolute right-2 top-2 rounded p-1 text-slate-400 opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-slate-100 hover:text-red-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(e);
                        }}
                        title="Delete Task"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
                <span className={clsx(
                    "priority-pill",
                    task.priority === "URGENT" ? "priority-critical" :
                        task.priority === "HIGH" ? "priority-high" :
                            task.priority === "LOW" ? "priority-low" : "priority-medium"
                )}>
                    {task.priority.toLowerCase()}
                </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
                {(task.tags || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="badge bg-slate-100 text-slate-700">{tag}</span>
                ))}
                {(task.tags || []).length > 2 && (
                    <span className="badge bg-slate-200/70 text-slate-700">
                        +{(task.tags || []).length - 2}
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{dueLabel(task.due_date)}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{task.comments || 0}</span>
                    <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{task.attachments || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                    {(task.assignees || []).slice(0, 3).map((id, index) => (
                        <div
                            key={id}
                            className={clsx(
                                "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white",
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
    );
}

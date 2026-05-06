import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, TeamMember } from "../types";
import TaskCard from "./TaskCard";

interface SortableTaskProps {
    task: Task;
    assigneeColors: string[];
    memberMap: Map<string, TeamMember>;
    initials: (name: string) => string;
    dueLabel: (value?: string) => string;
    onClick: (task: Task) => void;
    onDelete?: (task: Task) => void;
}

export default function SortableTask({
    task,
    onClick,
    onDelete,
    ...props
}: SortableTaskProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: "Task", task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    opacity: 0,
                    height: '100px', // Fallback height while dragging
                }}
            />
        );
    }


    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                onClick={() => onClick(task)}
                onDelete={onDelete ? () => onDelete(task) : undefined}
                {...props}
            />
        </div>
    );
}

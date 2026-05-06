"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import TaskModalBase, { BoardColumn, TaskDraft, TeamMember } from "./TaskModalBase";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    taskDraft: TaskDraft;
    setTaskDraft: Dispatch<SetStateAction<TaskDraft>>;
    tags: string[];
    customTag: string;
    setCustomTag: (value: string) => void;
    toggleTag: (tag: string) => void;
    addCustomTag: () => void;
    columns: BoardColumn[];
    members: TeamMember[];
    assigneeColors: string[];
    initials: (name: string) => string;
    toggleWatcher: (userId: string) => void;
    checklistInput: string;
    setChecklistInput: (value: string) => void;
    addChecklistItem: (value: string) => void;
    removeChecklistItem: (index: number) => void;
    isSaving?: boolean;
    titleError?: string;
    checklistError?: string;
    submitError?: string | null;
    onUploadFile?: (file: File) => Promise<void>;
    onRemoveFile?: (fileID: number) => Promise<void>;
}

export default function CreateTaskModal(props: Props) {
    return <TaskModalBase {...props} mode="create" />;
}

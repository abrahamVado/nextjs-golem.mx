"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import TaskModalBase, { BoardColumn, TaskDraft, TeamMember, TimeEntry } from "./TaskModalBase";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onDelete: () => void;
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
    timeEntries: TimeEntry[];
    timeEntryDate: string;
    setTimeEntryDate: (value: string) => void;
    timeEntryValue: string;
    setTimeEntryValue: (value: string) => void;
    addTimeEntry: () => void;
    removeTimeEntry: (id: string) => void;
    totalTime: string;
    isSaving?: boolean;
    isHydrating?: boolean;
    titleError?: string;
    checklistError?: string;
    timeEntryError?: string;
    submitError?: string | null;
    onUploadFile?: (file: File) => Promise<void>;
    onRemoveFile?: (fileID: number) => Promise<void>;
}

export default function EditTaskModal(props: Props) {
    return <TaskModalBase {...props} mode="edit" />;
}

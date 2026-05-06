export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ChecklistItem {
    id?: string;
    text: string;
    position?: number;
    completed?: boolean;
    completed_at?: string;
}

export interface ApiTimeEntry {
    id?: string;
    entry_date: string;
    minutes_spent: number;
}

export interface TaskFileRef {
    file_id: number;
    original_name: string;
    mime_type?: string;
    size_bytes?: number;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: Priority;
    status?: string;
    column_key?: string;
    assignees?: string[];
    watchers?: string[];
    owner_id?: string | null;
    story_points?: number | null;
    tags?: string[];
    due_date?: string;
    checklist?: ChecklistItem[];
    subtasks?: ChecklistItem[];
    files?: TaskFileRef[];
    time_entries?: ApiTimeEntry[];
    comments?: number;
    attachments?: number;
}

export interface Column {
    id: string;
    key: string;
    title: string;
    color: string;
    tasks: Task[];
}

export interface Project {
    id: string;
    name: string;
    description?: string;
}

export interface TeamMember {
    user_id: string;
    name: string;
    email: string;
}

export interface TimeEntry {
    id?: string;
    date: string;
    time: string;
}

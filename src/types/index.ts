export type EpicStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

export interface Epic {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    status: EpicStatus;
    start_date?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateEpicRequest {
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
}

export type MilestoneStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
    id: number;
    project_id: number;
    epic_id?: number;
    owner_id?: number;
    assignees?: number[];
    watchers?: number[];
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    created_at: string;
    updated_at: string;
}

export interface Milestone {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    status: MilestoneStatus;
    start_date?: string;
    due_date?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateMilestoneRequest {
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
}

export interface User {
    id: number;
    name?: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
    google_email?: string;
    google_picture_url?: string;
    google_linked_at?: string;
    microsoft_email?: string;
    microsoft_linked_at?: string;
    is_superuser: boolean;
    is_active: boolean;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
}

export interface APIClient {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    status: 'active' | 'disabled' | 'revoked' | string;
    revoked_at?: string;
    created_at: string;
    updated_at: string;
}

export interface APIClientPublicKey {
    id: number;
    client_id: number;
    algorithm: 'ed25519' | string;
    fingerprint_sha256: string;
    source_format: 'openssh' | string;
    status: 'pending' | 'active' | 'revoked' | string;
    activated_at?: string;
    revoked_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    is_system: boolean;
    team_id?: number;
    created_at: string;
}

export interface Permission {
    id: number;
    slug: string;
    description: string;
    created_at: string;
}

export interface TeamMember {
    user_id: number;
    name: string;
    email: string;
    role_name: string;
    role_id: number;
    joined_at: string;
}

export interface SessionPolicy {
    access_token_minutes: number;
    refresh_token_days: number;
    remember_refresh_token_days: number;
    idle_timeout_minutes: number;
    warning_before_expiry_seconds: number;
}

export interface SessionMetadata {
    access_expires_at: string;
    idle_timeout_minutes: number;
    warning_before_expiry_seconds: number;
    remember_me: boolean;
}

export interface Team {
    id: number;
    name: string;
    slug?: string;
}

export interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    type: string;
    created_at: string;
}

export interface Webhook {
    id: number;
    url: string;
    events: string[];
    created_at: string;
}

export interface AdminInvite {
    id: number;
    email: string;
    full_name?: string;
    invited_by: number;
    status: 'pending' | 'accepted' | 'revoked' | 'expired' | string;
    expires_at: string;
    accepted_at?: string;
    revoked_at?: string;
    created_at: string;
    updated_at: string;
}

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
export type TicketStatus = 'New' | 'Open' | 'Pending' | 'Resolved' | 'Closed' | 'Cancelled';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

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

export interface ProjectSummary {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    sprint_size?: number | null;
    sprint_start_date?: string;
}

export interface TicketTaskRecord {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority | string;
    column_key?: string;
    assignees?: string[];
    watchers?: string[];
    owner_id?: string | null;
    story_points?: number | null;
    due_date?: string;
    checklist?: { id: string; text: string; position: number; completed: boolean }[];
    subtasks?: { id: string; text: string; position: number; completed: boolean }[];
    time_entries?: { id?: string; entry_date: string; minutes_spent: number }[];
    tags?: string[];
}

export interface TicketListItem {
    id: string;
    ticket_number: string;
    title: string;
    description?: string;
    status: TicketStatus;
    priority: TicketPriority;
    project_id: string;
    project_name: string;
    requester_name: string;
    requester_id?: string | null;
    assignee_ids: string[];
    watcher_ids: string[];
    created_at?: string;
    updated_at?: string;
    due_date?: string;
    tags: string[];
    source: 'project_task_mvp';
}

export interface TicketDetail extends TicketListItem {
    // Additional fields for detailed view
    activity_history?: TicketActivity[];
    attachments?: TicketAttachment[];
    comments?: TicketComment[];
}

export interface PublicTicketCreateRequest {
    requester_name: string;
    requester_email: string;
    company?: string;
    title: string;
    description: string;
    priority?: TicketPriority;
    category?: string;
    due_date?: string;
    portal_password?: string;
}

export interface TicketActivity {
    id: string;
    timestamp: string;
    user_name: string;
    action: string;
    details: string;
}

export interface TicketAttachment {
    id: string;
    filename: string;
    size: number;
    uploaded_at: string;
    url: string;
}

export interface TicketComment {
    id: string;
    user_name: string;
    user_id: string;
    timestamp: string;
    content: string;
    is_internal_note: boolean;
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
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: 'active' | 'disabled' | 'revoked' | string;
    revoked_at?: string;
    created_at: string;
    updated_at: string;
}

export interface APIClientPublicKey {
    id: string;
    client_id: string;
    algorithm: 'ed25519' | string;
    fingerprint_sha256: string;
    source_format: 'openssh' | string;
    status: 'pending' | 'active' | 'revoked' | string;
    activated_at?: string;
    revoked_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectPublicPage {
    project_id: string;
    project_name: string;
    company_slug: string;
    slug: string;
    title: string;
    html_template?: string;
    access_mode: 'public' | 'password_protected' | string;
    is_enabled: boolean;
    requires_password: boolean;
    login_endpoint: string;
    register_endpoint: string;
    ticket_create_endpoint: string;
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

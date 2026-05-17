import axios from 'axios';
import {
  CreateEpicRequest,
  CreateMilestoneRequest,
  Epic,
  Milestone,
  Role,
  Permission,
  SessionPolicy,
  TeamMember,
  Team,
  Notification,
  User,
  APIClient,
  APIClientPublicKey,
  ProjectPublicPage,
  Webhook,
  AdminInvite,
  ProjectSummary,
  TicketListItem,
  TicketTaskRecord,
  TicketStatus,
} from '../types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.paladin.mx/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export function clearAccessToken() {
  // Browser auth now relies on HTTP-only cookies managed by the backend.
}

export function hasAccessToken() {
  return false;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = getCookie('csrf_token');
    if (csrf) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  }
);

export default api;

type UnknownRecord = Record<string, unknown>;

type TaskStatusUI = 'todo' | 'in_progress' | 'in_review' | 'backlog' | 'done' | 'archived';
type TaskPriorityUI = 'low' | 'medium' | 'high' | 'urgent';

function teamHeaders(teamID?: number | string | null): Record<string, string> {
  if (teamID == null || teamID === '') return {};
  return { 'X-Team-ID': String(teamID) };
}

function toCanonicalStatus(status?: string): string | undefined {
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'backlog':
      return 'BACKLOG';
    case 'todo':
      return 'TODO';
    case 'in_progress':
    case 'in-progress':
      return 'IN_PROGRESS';
    case 'in_review':
    case 'in-review':
      return 'IN_REVIEW';
    case 'done':
      return 'DONE';
    case 'archived':
      return 'ARCHIVED';
    default:
      return status.toUpperCase();
  }
}

function toCanonicalPriority(priority?: string): string | undefined {
  if (!priority) return undefined;
  const normalized = priority.toLowerCase();
  switch (normalized) {
    case 'low':
      return 'LOW';
    case 'medium':
      return 'MEDIUM';
    case 'high':
      return 'HIGH';
    case 'urgent':
      return 'URGENT';
    default:
      return priority.toUpperCase();
  }
}

function toTicketStatusFromTaskColumn(columnKey?: string): TicketStatus {
  const normalized = (columnKey || '').trim().toLowerCase();
  switch (normalized) {
    case 'todo':
    case 'backlog':
      return 'New';
    case 'in_progress':
    case 'in-progress':
    case 'in_review':
    case 'in-review':
      return 'Open';
    case 'done':
      return 'Resolved';
    case 'archived':
      return 'Closed';
    default:
      return 'Open';
  }
}

function toProjectSummary(input: UnknownRecord): ProjectSummary {
  return {
    id: String(input.id || ''),
    name: String(input.name || 'Untitled project'),
    description: typeof input.description === 'string' ? input.description : undefined,
    icon: typeof input.icon === 'string' ? input.icon : undefined,
    sprint_size: typeof input.sprint_size === 'number' ? input.sprint_size : null,
    sprint_start_date: typeof input.sprint_start_date === 'string' ? input.sprint_start_date : undefined,
  };
}

function toTicketTaskRecord(input: UnknownRecord): TicketTaskRecord {
  return {
    id: String(input.id || ''),
    title: String(input.title || 'Untitled task'),
    description: typeof input.description === 'string' ? input.description : undefined,
    priority: String(input.priority || 'MEDIUM').toUpperCase(),
    column_key: typeof input.column_key === 'string' ? input.column_key : undefined,
    assignees: Array.isArray(input.assignees) ? input.assignees.map((value) => String(value)) : [],
    watchers: Array.isArray(input.watchers) ? input.watchers.map((value) => String(value)) : [],
    owner_id: input.owner_id == null ? null : String(input.owner_id),
    story_points: typeof input.story_points === 'number' ? input.story_points : null,
    due_date: typeof input.due_date === 'string' ? input.due_date : undefined,
    checklist: Array.isArray(input.checklist)
      ? input.checklist.map((item) => {
          const row = item as UnknownRecord;
          return {
            id: String(row.id || ''),
            text: String(row.text || ''),
            position: Number(row.position || 0),
            completed: Boolean(row.completed),
          };
        })
      : [],
    subtasks: Array.isArray(input.subtasks)
      ? input.subtasks.map((item) => {
          const row = item as UnknownRecord;
          return {
            id: String(row.id || ''),
            text: String(row.text || ''),
            position: Number(row.position || 0),
            completed: Boolean(row.completed),
          };
        })
      : [],
    time_entries: Array.isArray(input.time_entries)
      ? input.time_entries.map((item) => {
          const row = item as UnknownRecord;
          return {
            id: row.id == null ? undefined : String(row.id),
            entry_date: String(row.entry_date || ''),
            minutes_spent: Number(row.minutes_spent || 0),
          };
        })
      : [],
    tags: Array.isArray(input.tags) ? input.tags.map((value) => String(value)) : [],
  };
}

export const authApi = {
  login: async (data: { email: string; password: string; remember_me?: boolean }) => {
    return api.post<{ data: { token_type: string; expires_in: number } }>('/auth/login', data);
  },
  refresh: async () => {
    return api.post<{ data: { token_type: string; expires_in: number } }>('/auth/refresh', {});
  },
  logout: async () => {
    try {
      return await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
  },
  googleLoginURL: () => `${API_BASE_URL}/auth/google/login`,
  googleLinkURL: () => `${API_BASE_URL}/auth/google/link`,
  microsoftLoginURL: () => `${API_BASE_URL}/auth/microsoft/login`,
  microsoftLinkURL: () => `${API_BASE_URL}/auth/microsoft/link`,
  disconnectGoogle: () => api.post('/auth/google/disconnect'),
  disconnectMicrosoft: () => api.post('/auth/microsoft/disconnect'),
  verifyInvite: (token: string) => api.get<{ data: { email: string; full_name?: string; status: string; expires_at: string } }>(`/auth/invites/verify?token=${encodeURIComponent(token)}`),
  acceptInvite: (data: { token: string; full_name: string; password: string }) => api.post('/auth/invites/accept', data),
};

export const whitelistApi = {
  create: (data: { name: string; email: string; company?: string; subject?: string; message: string }) =>
    api.post('/whitelist', data),
};

export const teamApi = {
  createTeam: (data: { name: string; slug: string }) => api.post<{ data: Team }>('/teams', data),
  updateTeam: (teamID: number | string, data: { name: string; slug: string }) =>
    api.put<{ data: Team }>(`/teams/${teamID}`, data, { headers: teamHeaders(teamID) }),
  deleteTeam: (teamID: number | string) =>
    api.delete(`/teams/${teamID}`, { headers: teamHeaders(teamID) }),
  getMyTeams: () => api.get<{ data: Team[] }>('/teams'),
  getMembers: (teamID: number | string) => api.get<{ data: TeamMember[] }>(`/teams/${teamID}/members`, { headers: { 'X-Team-ID': String(teamID) } }),
  addMember: (teamID: number | string, data: { email: string; name?: string; role_id: number }) =>
    api.post(`/teams/${teamID}/members`, data, { headers: { 'X-Team-ID': String(teamID) } }),
  assignMemberRoles: (teamID: number | string, userID: number, roleIDs: number[]) =>
    api.put(`/teams/${teamID}/members/${userID}/roles`, { role_ids: roleIDs }, { headers: { 'X-Team-ID': String(teamID) } }),
  getRoles: (teamID: number | string, includePermissions = false) =>
    api.get<{ data: Role[] }>(`/teams/${teamID}/roles`, { params: { include_permissions: includePermissions }, headers: { 'X-Team-ID': String(teamID) } }),
  createRole: (teamID: number | string, data: { name: string; description?: string }) =>
    api.post<{ data: Role }>(`/teams/${teamID}/roles`, data, { headers: { 'X-Team-ID': String(teamID) } }),
  updateRole: (teamID: number | string, roleID: number, data: { name: string; description?: string }) =>
    api.put<{ data: Role }>(`/teams/${teamID}/roles/${roleID}`, data, { headers: { 'X-Team-ID': String(teamID) } }),
  cloneRole: (teamID: number | string, roleID: number, name?: string) =>
    api.post<{ data: Role }>(`/teams/${teamID}/roles/${roleID}/clone`, { name }, { headers: { 'X-Team-ID': String(teamID) } }),
  deleteRole: (teamID: number | string, roleID: number) =>
    api.delete(`/teams/${teamID}/roles/${roleID}`, { headers: { 'X-Team-ID': String(teamID) } }),
  getRolePermissions: (teamID: number | string, roleID: number) =>
    api.get<{ data: Permission[] }>(`/teams/${teamID}/roles/${roleID}/permissions`, { headers: { 'X-Team-ID': String(teamID) } }),
  updateRolePermissions: (teamID: number | string, roleID: number, permissionIDs: number[]) =>
    api.put(`/teams/${teamID}/roles/${roleID}/permissions`, { permission_ids: permissionIDs }, { headers: { 'X-Team-ID': String(teamID) } }),
  getPermissions: (teamID: number | string) =>
    api.get<{ data: Permission[] }>(`/teams/${teamID}/permissions`, { headers: { 'X-Team-ID': String(teamID) } }),
  getGroupedPermissions: (teamID: number | string) =>
    api.get<{ data: Record<string, Permission[]> }>(`/teams/${teamID}/permissions/grouped`, { headers: { 'X-Team-ID': String(teamID) } }),
};

export const projectApi = {
  listProjects: (teamID: number | string) => api.get<{ data: UnknownRecord[] }>('/projects', { headers: teamHeaders(teamID) }),
  createProject: (
    teamID: number | string,
    data: {
      name: string;
      description: string;
      icon?: string;
      sprint_size?: number | null;
      sprint_start_date?: string;
      members?: { user_id: string; role: "admin" | "member" }[];
    }
  ) =>
    api.post<{ data: UnknownRecord }>('/projects', data, { headers: teamHeaders(teamID) }),
  updateProject: (
    projectId: string | number,
    teamID: number | string,
    data: {
      name: string;
      description: string;
      icon?: string;
      sprint_size?: number | null;
      sprint_start_date?: string;
    }
  ) =>
    api.put<{ data: UnknownRecord }>(`/projects/${projectId}`, data, { headers: teamHeaders(teamID) }),
  deleteProject: (projectId: string | number, teamID: number | string) =>
    api.delete(`/projects/${projectId}`, { headers: teamHeaders(teamID) }),
  getProject: (projectId: string | number) => api.get<{ data: UnknownRecord }>(`/projects/${projectId}`),
  getBoard: (projectId: string | number, teamID: number | string) =>
    api.get<{ data: { columns: { id: string; key: string; title: string; color: string; tasks: UnknownRecord[] }[] } }>(`/projects/${projectId}/board`, { headers: teamHeaders(teamID) }),
  getMembers: (projectId: string | number) => api.get<{ data: UnknownRecord[] }>(`/projects/${projectId}/members`),
  getPublicPage: (projectId: string | number) => api.get<{ data: ProjectPublicPage }>(`/projects/${projectId}/public-page`),
  updatePublicPage: (
    projectId: string | number,
    data: {
      enabled: boolean;
      access_mode: 'public' | 'password_protected';
      password?: string;
      slug?: string;
      title?: string;
      html_template?: string;
    }
  ) => api.put<{ data: ProjectPublicPage }>(`/projects/${projectId}/public-page`, data),
  updateMembers: (
    projectId: string | number,
    members: { user_id: string; role: "admin" | "member" }[]
  ) => api.put<{ data: UnknownRecord[] }>(`/projects/${projectId}/members`, { members }),
  getEpics: (projectId: string | number) => api.get<{ data: Epic[] }>(`/projects/${projectId}/epics`),
  createEpic: (projectId: string | number, data: CreateEpicRequest) => api.post<{ data: Epic }>(`/projects/${projectId}/epics`, data),
  getMilestones: (projectId: string | number) => api.get<{ data: Milestone[] }>(`/projects/${projectId}/milestones`),
  createMilestone: (projectId: string | number, data: CreateMilestoneRequest) => api.post<{ data: Milestone }>(`/projects/${projectId}/milestones`, data),
};

export const taskApi = {
  listByProject: (projectId: number | string, teamID: number | string) =>
    api.get<{ data: UnknownRecord[] }>(`/projects/${projectId}/tasks`, { headers: teamHeaders(teamID) }),
  create: (
    projectId: number | string,
    teamID: number | string,
    data: {
      title: string;
      description?: string;
      status?: TaskStatusUI | string;
      priority?: TaskPriorityUI | string;
      due_date?: string;
    }
  ) =>
    api.post<{ data: UnknownRecord }>(
      `/projects/${projectId}/tasks`,
      {
        ...data,
        status: toCanonicalStatus(data.status),
        priority: toCanonicalPriority(data.priority),
      },
      { headers: teamHeaders(teamID) }
    ),
  update: (
    taskId: number | string,
    teamID: number | string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatusUI | string;
      priority?: TaskPriorityUI | string;
    }
  ) =>
    api.put<{ data: UnknownRecord }>(
      `/tasks/${taskId}`,
      {
        ...data,
        status: toCanonicalStatus(data.status),
        priority: toCanonicalPriority(data.priority),
      },
      { headers: teamHeaders(teamID) }
    ),
  remove: (taskId: number | string, teamID: number | string) =>
    api.delete(`/tasks/${taskId}`, { headers: teamHeaders(teamID) }),
  move: (taskId: number | string, teamID: number | string, columnKey: string) =>
    api.patch(`/tasks/${taskId}/move`, { column_key: columnKey }, { headers: teamHeaders(teamID) }),
};

export const userApi = {
  getMe: () => api.get<{ data: { user_id: string; company_id: string; branch_id?: string | null; name?: string; email?: string; role?: string; permission_names?: string[]; avatar_url?: string; account_type?: string; is_premium?: boolean; is_blocked?: boolean; premium_days_remaining?: number; free_days_remaining?: number; premium_expires_at?: string | null; free_expires_at?: string | null; blocked_at?: string | null } }>('/me'),
  updateMe: (data: { name: string }) => api.patch<{ data: { user_id: string; company_id: string; branch_id?: string | null; name?: string; email?: string; role?: string; permission_names?: string[]; avatar_url?: string; account_type?: string; is_premium?: boolean; is_blocked?: boolean; premium_days_remaining?: number; free_days_remaining?: number; premium_expires_at?: string | null; free_expires_at?: string | null; blocked_at?: string | null } }>('/me', data),
  listUsers: () => api.get<{ data: { company_id: string; module: string; items: unknown[] } }>('/users'),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<{ data: User }>('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (data: { old_password: string; new_password: string }) => api.put('/users/me/password', data),
};

export const dashboardApi = {
  getSummary: () =>
    api.get<{
      data: {
        company_id: string;
        generated_at: string;
        project_count: number;
        task_count: number;
        team_member_count: number;
        completed_task_count: number;
        completion_rate: number;
        task_status: { key: string; label: string; count: number }[];
        project_activity: { name: string; tasks: number }[];
        recent_projects: { id: string; name: string; description?: string; icon?: string; created_at?: string; task_count: number }[];
      };
    }>('/dashboard/summary'),
  getSystemLogs: (limit = 12) =>
    api.get<{
      data: {
        company_id: string;
        generated_at: string;
        items: {
          id: string;
          timestamp: string;
          action: string;
          resource: string;
          actor_name?: string;
          ip_address?: string;
          user_agent?: string;
          message: string;
          severity: 'info' | 'warn' | 'error' | 'success' | string;
        }[];
      };
    }>(`/dashboard/system-logs?limit=${encodeURIComponent(String(limit))}`),
};

export const notificationApi = {
  getAll: () => api.get<{ data: Notification[] }>('/notifications'),
  getUnreadCount: () => api.get<{ data: { count: number } }>('/notifications/unread-count'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const webhookApi = {
  getAll: () => api.get<{ data: Webhook[] }>('/webhooks'),
  create: (data: { url: string; events: string[] }) => api.post<{ data: Webhook }>('/webhooks', data),
  delete: (id: string | number) => api.delete(`/webhooks/${id}`),
};

export const adminApi = {
  getUsers: () => api.get<{ data: UnknownRecord[] }>('/admin/users'),
  updateUserStatus: (id: number, isActive: boolean) => api.put(`/admin/users/${id}/status`, { is_active: isActive }),
  impersonateUser: (id: number) => api.post(`/admin/users/${id}/impersonate`),
  getRoles: () => api.get<{ data: Role[] }>('/admin/roles'),
  getPermissions: () => api.get<{ data: Permission[] }>('/admin/permissions'),
  getSessionPolicy: () => api.get<{ data: SessionPolicy }>('/admin/security/session-policy'),
  updateSessionPolicy: (data: SessionPolicy) => api.put('/admin/security/session-policy', data),
  createInvite: (data: { email: string; full_name?: string; expires_in_hours?: number }) => api.post<{ data: AdminInvite; warning?: string }>('/admin/invites', data),
  listInvites: () => api.get<{ data: AdminInvite[] }>('/admin/invites'),
  revokeInvite: (id: number) => api.post(`/admin/invites/${id}/revoke`),
};

export const apiKeyApi = {
  createClient: (data: { name: string; description?: string }) => api.post<{ data: APIClient }>('/apikeys/clients', data),
  listClients: () => api.get<{ data: APIClient[] }>('/apikeys/clients'),
  createKey: (clientId: string, data: { scopes: string[]; expires_at?: string }) =>
    api.post<{ data: { key_id: string; scopes: string[]; expires_at?: string; api_key_secret_once: string; full_token_once: string } }>(
      `/apikeys/clients/${clientId}/keys`,
      data
    ),
  revokeKey: (clientId: string, keyId: string) => api.post(`/apikeys/clients/${clientId}/keys/${keyId}/revoke`),
  uploadPublicKey: (clientId: string, opensshPublicKey: string) =>
    api.post<{ data: APIClientPublicKey }>(`/apikeys/clients/${clientId}/public-keys`, { openssh_public_key: opensshPublicKey }),
  activatePublicKey: (clientId: string, publicKeyId: string, challenge: string, challengeSignature: string) =>
    api.post(`/apikeys/clients/${clientId}/public-keys/${publicKeyId}/activate`, {
      challenge,
      challenge_signature: challengeSignature,
    }),
  revokePublicKey: (clientId: string, publicKeyId: string) =>
    api.post(`/apikeys/clients/${clientId}/public-keys/${publicKeyId}/revoke`),
};

export const ticketApi = {
  listInbox: async (teamID: number | string): Promise<TicketListItem[]> => {
    const projectsResponse = await projectApi.listProjects(teamID);
    const projects = (projectsResponse.data.data || []).map((item) => toProjectSummary(item as UnknownRecord));

    const boardResponses = await Promise.all(
      projects.map(async (project) => {
        const boardResponse = await projectApi.getBoard(project.id, teamID);
        return {
          project,
          columns: boardResponse.data.data?.columns || [],
        };
      })
    );

    return boardResponses.flatMap(({ project, columns }) =>
      columns.flatMap((column) =>
        (column.tasks || []).map((task) => {
          const normalized = toTicketTaskRecord(task as UnknownRecord);
          return {
            id: normalized.id,
            ticket_number: `TKT-${normalized.id.slice(0, 8).toUpperCase()}`,
            title: normalized.title,
            description: normalized.description,
            status: toTicketStatusFromTaskColumn(normalized.column_key || column.key),
            priority: String(normalized.priority || 'MEDIUM').toUpperCase() as TicketListItem['priority'],
            project_id: project.id,
            project_name: project.name,
            requester_name: normalized.owner_id ? `User ${normalized.owner_id.slice(0, 8)}` : 'Portal requester',
            requester_id: normalized.owner_id || null,
            assignee_ids: normalized.assignees || [],
            watcher_ids: normalized.watchers || [],
            created_at: undefined,
            updated_at: undefined,
            due_date: normalized.due_date,
            tags: normalized.tags || [],
            source: 'project_task_mvp' as const,
          };
        })
      )
    );
  },
  getById: async (ticketId: string): Promise<TicketTaskRecord> => {
    const response = await api.get<{ data: UnknownRecord }>(`/tasks/${ticketId}`);
    return toTicketTaskRecord((response.data.data || {}) as UnknownRecord);
  },
};

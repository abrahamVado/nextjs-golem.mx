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
  Webhook,
  AdminInvite,
} from '../types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const ACCESS_TOKEN_STORAGE_KEY = 'paladin_access_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function storeAccessToken(token: string | null | undefined) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function clearAccessToken() {
  storeAccessToken(null);
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

api.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

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
  (response) => {
    const maybeToken = (response.data as { data?: { access_token?: string } } | undefined)?.data?.access_token;
    if (maybeToken) {
      storeAccessToken(maybeToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const requestUrl: string = originalRequest.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password") ||
      requestUrl.includes("/auth/verify-email") ||
      requestUrl.includes("/auth/resend-verification") ||
      requestUrl.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await api.post<{ data: { access_token: string } }>('/auth/refresh', {});
        const refreshedToken = refreshResponse.data.data.access_token;
        storeAccessToken(refreshedToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        return api(originalRequest);
      } catch {
        clearAccessToken();
        // Preserve the original 401 from the request that failed.
        return Promise.reject(error);
      }
    }

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

export const authApi = {
  login: async (data: { email: string; password: string; remember_me?: boolean }) => {
    const response = await api.post<{ data: { access_token: string; token_type: string; expires_in: number } }>('/auth/login', data);
    storeAccessToken(response.data.data.access_token);
    return response;
  },
  refresh: async () => {
    const response = await api.post<{ data: { access_token: string; token_type: string; expires_in: number } }>('/auth/refresh', {});
    storeAccessToken(response.data.data.access_token);
    return response;
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
  getMembers: (projectId: string | number) => api.get<{ data: UnknownRecord[] }>(`/projects/${projectId}/members`),
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
  getMe: () => api.get<{ data: { user_id: string; company_id: string; branch_id?: string | null; name?: string; email?: string; role?: string; avatar_url?: string } }>('/me'),
  updateMe: (data: { name: string }) => api.patch<{ data: { user_id: string; company_id: string; branch_id?: string | null; name?: string; email?: string; role?: string; avatar_url?: string } }>('/me', data),
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
  createKey: (clientId: number, data: { scopes: string[]; expires_at?: string }) =>
    api.post<{ data: { key_id: string; scopes: string[]; expires_at?: string; api_key_secret_once: string; full_token_once: string } }>(
      `/apikeys/clients/${clientId}/keys`,
      data
    ),
  revokeKey: (clientId: number, keyId: string) => api.post(`/apikeys/clients/${clientId}/keys/${keyId}/revoke`),
  uploadPublicKey: (clientId: number, opensshPublicKey: string) =>
    api.post<{ data: APIClientPublicKey }>(`/apikeys/clients/${clientId}/public-keys`, { openssh_public_key: opensshPublicKey }),
  activatePublicKey: (clientId: number, publicKeyId: number, challenge: string, challengeSignature: string) =>
    api.post(`/apikeys/clients/${clientId}/public-keys/${publicKeyId}/activate`, {
      challenge,
      challenge_signature: challengeSignature,
    }),
  revokePublicKey: (clientId: number, publicKeyId: number) =>
    api.post(`/apikeys/clients/${clientId}/public-keys/${publicKeyId}/revoke`),
};

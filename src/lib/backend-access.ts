import api from "@/lib/api";

export type BackendMe = {
    user_id: string;
    company_id: string;
    branch_id?: string | null;
    name?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
    account_type?: string;
    is_premium?: boolean;
    is_blocked?: boolean;
    premium_days_remaining?: number;
    free_days_remaining?: number;
    premium_expires_at?: string | null;
    free_expires_at?: string | null;
    blocked_at?: string | null;
};

export type BackendListEnvelope = {
    company_id: string;
    module: string;
    items: Array<Record<string, unknown>>;
};

export async function getBackendMe() {
    return api.get<{ data: BackendMe }>("/me");
}

export async function getBackendUsers() {
    return api.get<{ data: BackendListEnvelope }>("/users");
}

export async function createBackendUser(payload: {
    email: string;
    name: string;
    password: string;
    status?: string;
    role_ids?: string[];
}) {
    return api.post<{ data: Record<string, unknown> }>("/users", payload);
}

export async function updateBackendUser(userId: string, payload: {
    email: string;
    name: string;
    status?: string;
    role_ids?: string[];
}) {
    return api.patch<{ data: Record<string, unknown> }>(`/users/${userId}`, payload);
}

export async function deleteBackendUser(userId: string) {
    return api.delete<{ data: Record<string, unknown> }>(`/users/${userId}`);
}

export async function getBackendRoles() {
    return api.get<{ data: BackendListEnvelope }>("/roles");
}

export async function createBackendRole(payload: {
    name: string;
    description?: string;
    permission_ids?: string[];
}) {
    return api.post<{ data: Record<string, unknown> }>("/roles", payload);
}

export async function getBackendRolePermissions(roleId: string) {
    return api.get<{ data: { id: string; module: string; items: Array<Record<string, unknown>> } }>(`/roles/${roleId}/permissions`);
}

export async function updateBackendRole(roleId: string, payload: {
    name?: string;
    description?: string;
    permission_ids?: string[];
}) {
    return api.patch<{ data: Record<string, unknown> }>(`/roles/${roleId}`, payload);
}

export async function deleteBackendRole(roleId: string) {
    return api.delete<{ data: Record<string, unknown> }>(`/roles/${roleId}`);
}

export async function getBackendPermissions() {
    return api.get<{ data: BackendListEnvelope }>("/permissions");
}

export async function createBackendPermission(payload: {
    name: string;
    description?: string;
}) {
    return api.post<{ data: Record<string, unknown> }>("/permissions", payload);
}

export async function getBackendCurrentCompany() {
    return api.get<{ data: Record<string, unknown> }>("/companies/current");
}

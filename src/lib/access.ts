type AccessUser = {
    role?: string;
    is_superuser?: boolean;
    permission_names?: string[];
} | null | undefined;

const CLIENT_ALLOWED_PREFIXES = [
    "/dashboard",
    "/dashboard/tickets",
    "/dashboard/projects",
    "/dashboard/teams",
    "/dashboard/access",
    "/dashboard/settings",
];

export function normalizeRole(role?: string | null): string {
    return (role || "").trim().toLowerCase();
}

export function isClientRole(user: AccessUser): boolean {
    if (!user) return false;
    return normalizeRole(user.role) === "client";
}

export function canAccessDashboardPath(user: AccessUser, pathname: string): boolean {
    if (!isClientRole(user)) return true;
    if (pathname === "/dashboard/api" || pathname.startsWith("/dashboard/api/")) {
        return hasApiAdminAccess(user);
    }
    return CLIENT_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function hasPermission(user: AccessUser, permission: string): boolean {
    if (!user || !permission) return false;
    if (user.is_superuser) return true;

    const names = Array.isArray(user.permission_names) ? user.permission_names : [];
    return names.some((item) => item.trim().toLowerCase() === permission.trim().toLowerCase());
}

export function hasApiAdminAccess(user: AccessUser): boolean {
    return hasPermission(user, "apikey:manage");
}

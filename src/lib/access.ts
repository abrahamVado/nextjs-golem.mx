type AccessUser = {
    role?: string;
    is_superuser?: boolean;
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
    return CLIENT_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function hasApiAdminAccess(user: AccessUser): boolean {
    if (!user) return false;
    if (user.is_superuser) return true;

    const role = normalizeRole(user.role);
    return role.includes('root') || role.includes('admin') || role.includes('owner');
}

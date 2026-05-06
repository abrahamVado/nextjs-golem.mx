type AccessUser = {
    role?: string;
    is_superuser?: boolean;
} | null | undefined;

export function hasApiAdminAccess(user: AccessUser): boolean {
    if (!user) return false;
    if (user.is_superuser) return true;

    const role = (user.role || '').toLowerCase();
    return role.includes('root') || role.includes('admin') || role.includes('owner');
}

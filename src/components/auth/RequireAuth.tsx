"use client";

import { useAuth } from "@/context/AuthContext";
import { canAccessDashboardPath } from "@/lib/access";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
            return;
        }

        if (!isLoading && user && pathname?.startsWith("/dashboard") && !canAccessDashboardPath(user, pathname)) {
            router.push("/dashboard");
        }
    }, [user, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    if (pathname?.startsWith("/dashboard") && !canAccessDashboardPath(user, pathname)) {
        return null;
    }

    return <>{children}</>;
}

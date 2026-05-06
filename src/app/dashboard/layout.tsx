"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <RequireAuth>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </RequireAuth>
    );
}

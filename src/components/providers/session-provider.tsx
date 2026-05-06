"use client";

import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const { user, session, logout, refreshSession } = useAuth();
    const [now, setNow] = useState(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(Date.now());
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    let msRemaining: number | null = null;
    if (session?.access_expires_at) {
        const expiry = new Date(session.access_expires_at).getTime();
        if (!Number.isNaN(expiry)) {
            msRemaining = expiry - now;
        }
    }
    const warningMs = (session?.warning_before_expiry_seconds || 120) * 1000;
    const warningOpen = !!user && msRemaining != null && msRemaining <= warningMs && msRemaining > 0;

    useEffect(() => {
        if (user && msRemaining != null && msRemaining <= 0) {
            logout();
        }
    }, [user, msRemaining, logout]);

    const continueSession = async () => {
        await authApi.refresh();
        await refreshSession();
    };

    const minutes = Math.max(0, Math.ceil((msRemaining || 0) / 60000));

    return (
        <>
            {children}
            {warningOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">Session Expiring Soon</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Your session will close in about {minutes} minute{minutes === 1 ? "" : "s"}.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={logout}>Logout</Button>
                            <Button onClick={continueSession}>Continue</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

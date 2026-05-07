"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import api, { authApi } from "@/lib/api";
import { SessionMetadata, SessionPolicy } from "@/types";
import { useRouter } from "next/navigation";
import { resolveAssetURL } from "@/lib/assets";

interface User {
    id: string;
    email: string;
    company_id?: string;
    branch_id?: string | null;
    full_name?: string;
    name?: string;
    role?: string;
    avatar_url?: string;
    google_email?: string;
    google_picture_url?: string;
    google_linked_at?: string;
    is_superuser?: boolean;
    is_active?: boolean;
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;
}

type MeResponse = {
    user_id: string;
    company_id: string;
    branch_id?: string | null;
    name?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
};

interface LoginCredentials {
    email: string;
    password: string;
    remember_me?: boolean;
}

interface RegisterPayload {
    company_name: string;
    email: string;
    password: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    session: SessionMetadata | null;
    sessionPolicy: SessionPolicy | null;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtPayload(token: string): { user_id: string; company_id: string; branch_id?: string | null } | null {
    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        const decoded = JSON.parse(atob(padded)) as { user_id: string; company_id: string; branch_id?: string | null };
        if (!decoded.user_id || !decoded.company_id) return null;
        return decoded;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<SessionMetadata | null>(null);
    const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastSessionRefreshRef = useRef(0);
    const router = useRouter();

    const refreshSession = useCallback(async () => {
        const now = Date.now();
        if (now-lastSessionRefreshRef.current < 15_000) {
            return;
        }
        lastSessionRefreshRef.current = now;
        setSession(null);
        setSessionPolicy(null);
    }, []);

    const checkAuth = useCallback(async () => {
        try {
            const userRes = await api.get("/me");
            const payload = userRes.data.data as MeResponse;
            setUser({
                id: payload.user_id,
                company_id: payload.company_id,
                branch_id: payload.branch_id,
                email: payload.email || "",
                name: payload.name || payload.user_id,
                role: payload.role,
                avatar_url: resolveAssetURL(payload.avatar_url),
            });
            await refreshSession();
        } catch {
            setUser(null);
            setSession(null);
            setSessionPolicy(null);
        } finally {
            setIsLoading(false);
        }
    }, [refreshSession]);

    useEffect(() => {
        void checkAuth();
    }, [checkAuth]);

    const login = async (credentials: LoginCredentials) => {
        const loginRes = await authApi.login(credentials);
        const token = loginRes.data.data.access_token;
        const payload = parseJwtPayload(token);

        if (payload) {
            setUser({
                id: payload.user_id,
                company_id: payload.company_id,
                branch_id: payload.branch_id,
                email: "",
                name: payload.user_id,
                avatar_url: resolveAssetURL(undefined),
            });
            setIsLoading(false);
        }

        await checkAuth();
        router.push("/dashboard");
    };

    const register = async (data: RegisterPayload) => {
        await api.post("/auth/register", data);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            setUser(null);
            setSession(null);
            setSessionPolicy(null);
            router.push("/login");
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, sessionPolicy, isLoading, login, register, logout, refreshSession, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

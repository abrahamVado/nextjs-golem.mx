"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import api, { authApi, clearAccessToken } from "@/lib/api";
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

type MeResponse = {
    user_id: string;
    company_id: string;
    branch_id?: string | null;
    name?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
};

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<SessionMetadata | null>(null);
    const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const clearAuthState = useCallback(() => {
        clearAccessToken();
        setUser(null);
        setSession(null);
        setSessionPolicy(null);
    }, []);

    const refreshSession = useCallback(async () => {
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
            clearAuthState();
        } finally {
            setIsLoading(false);
        }
    }, [clearAuthState, refreshSession]);

    useEffect(() => {
        let active = true;

        const bootstrapAuth = async () => {
            setIsLoading(true);
            try {
                await authApi.refresh();
                if (!active) return;
                await checkAuth();
            } catch {
                if (!active) return;
                clearAuthState();
                setIsLoading(false);
            }
        };

        void bootstrapAuth();

        return () => {
            active = false;
        };
    }, [checkAuth, clearAuthState]);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        await authApi.login(credentials);
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
            clearAuthState();
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

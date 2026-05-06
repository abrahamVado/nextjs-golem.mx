"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type FeedbackTone = "success" | "error" | "info";

type Toast = {
    id: number;
    tone: FeedbackTone;
    message: string;
};

type FeedbackContextType = {
    notify: (message: string, tone?: FeedbackTone) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
};

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const notify = (message: string, tone: FeedbackTone = "info") => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev, { id, tone, message }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3500);
    };

    const value = useMemo(
        () => ({
            notify,
            success: (message: string) => notify(message, "success"),
            error: (message: string) => notify(message, "error"),
            info: (message: string) => notify(message, "info"),
        }),
        []
    );

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[99999] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
                {toasts.map((toast) => {
                    const color =
                        toast.tone === "success"
                            ? "border-emerald-500/50 bg-emerald-50 text-emerald-900"
                            : toast.tone === "error"
                                ? "border-red-500/50 bg-red-50 text-red-900"
                                : "border-slate-400/50 bg-slate-50 text-slate-900";
                    return (
                        <div key={toast.id} className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow ${color}`}>
                            {toast.message}
                        </div>
                    );
                })}
            </div>
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useFeedback must be used within a FeedbackProvider");
    }
    return context;
}

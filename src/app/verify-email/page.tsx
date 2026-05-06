"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"verifying" | "success" | "error">(() => (token ? "verifying" : "error"));
    const [message, setMessage] = useState(() => (token ? "" : "Missing verification token."));

    useEffect(() => {
        if (!token) return;

        const verify = async () => {
            try {
                await api.post("/auth/verify-email", { token });
                setStatus("success");
            } catch (error: unknown) {
                const maybeMessage =
                    typeof error === "object" &&
                        error !== null &&
                        "response" in error &&
                        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
                        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                        : null;
                setStatus("error");
                setMessage(maybeMessage || "Verification failed. Link might be expired.");
            }
        };

        void verify();
    }, [token]);

    return (
        <div className="w-full max-w-sm space-y-6 rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm">
            {status === "verifying" && (
                <div className="space-y-4">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
                    <p>Verifying your email...</p>
                </div>
            )}

            {status === "success" && (
                <div className="space-y-4">
                    <div className="mb-2 text-4xl text-green-500">OK</div>
                    <h2 className="text-xl font-bold text-gray-900">Email Verified!</h2>
                    <p className="text-gray-500">Your account is now fully active.</p>
                    <ButtonLink href="/login">Go to Login</ButtonLink>
                </div>
            )}

            {status === "error" && (
                <div className="space-y-4">
                    <div className="mb-2 text-4xl text-red-500">X</div>
                    <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
                    <p className="text-sm text-red-500">{message}</p>
                    <ButtonLink href="/login">Back to Login</ButtonLink>
                </div>
            )}
        </div>
    );
}

function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
            {children}
        </Link>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}

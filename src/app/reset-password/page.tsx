"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, Suspense } from "react";
import api from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/errors";

const schema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing token.");
            return;
        }

        setStatus("idle");
        setMessage("");
        try {
            await api.post("/auth/reset-password", { token, new_password: data.password });
            setStatus("success");
            setMessage("Password reset successfully. You can now login.");
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: unknown) {
            setStatus("error");
            setMessage(getErrorMessage(err, "Failed to reset password."));
        }
    };

    if (!token) {
        return (
            <div className="text-center text-red-500">
                Invalid request. Missing reset token.
            </div>
        )
    }

    return (
        <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
            </div>

            {status === "success" ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">
                    {message}
                    <p className="mt-2 text-xs text-gray-500">Redirecting to login...</p>
                </div>
            ) : (
                <>
                    {status === 'error' && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">New Password</label>
                            <Input
                                type="password"
                                {...register("password")}
                            />
                            {errors.password?.message && (
                                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Confirm Password</label>
                            <Input
                                type="password"
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword?.message && (
                                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                        <Button type="submit" className="w-full" isLoading={isSubmitting}>
                            Reset Password
                        </Button>
                    </form>
                </>
            )}
        </div>
    )
}


export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}

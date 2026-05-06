"use client";

import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { authApi } from "@/lib/api";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
    remember_me: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return new URL(window.location.href).searchParams.get("error");
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { remember_me: false },
    });

    const onSubmit = async (data: LoginFormData) => {
        setError(null);
        try {
            await login(data);
            // Login function handles redirection to dashboard
        } catch (err: unknown) {
            // Specific error handling based on status code
            const status = typeof err === "object" && err !== null && "response" in err ? (err as { response?: { status?: number } }).response?.status : undefined;
            if (status === 401) {
                setError("Invalid email or password. Please try again.");
            } else if (status === 429) {
                setError("Too many login attempts. Please try again later.");
            } else {
                setError(getErrorMessage(err, "An unexpected error occurred. Please try again."));
            }
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-gray-500">
                        Enter your credentials to sign in
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                            type="email"
                            placeholder="m@example.com"
                            {...register("email")}
                        />
                        {errors.email?.message && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <Input
                            type="password"
                            {...register("password")}
                        />
                        {errors.password?.message && (
                            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                        )}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" {...register("remember_me")} />
                        Remember me
                    </label>
                    <Button type="submit" className="w-full" isLoading={isSubmitting}>
                        Sign In
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            window.location.href = authApi.googleLoginURL();
                        }}
                    >
                        Continue with Google
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            window.location.href = authApi.microsoftLoginURL();
                        }}
                    >
                        Continue with Microsoft
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-gray-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                            Sign up
                        </Link>
                    </p>
                    <p className="mt-2">
                        <Link href="/forgot-password" className="text-gray-500 hover:text-gray-900 underline">
                            Forgot your password?
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

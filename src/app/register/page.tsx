"use client";

import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/lib/api";

const registerSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email(),
    password: z.string().min(10, "Password must be at least 10 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register: registerAuth } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setError(null);
        try {
            await registerAuth({
                company_name: data.companyName,
                email: data.email,
                password: data.password,
                name: data.fullName
            });
            setError("Registration request reached the Go backend, but the register flow is still scaffolded there.");
        } catch (err: unknown) {
            const maybeErr = err as { response?: { data?: { message?: string } } };
            const apiMessage = maybeErr.response?.data?.message
                || maybeErr.response?.data?.error?.message;
            if (apiMessage) {
                setError(apiMessage);
            } else {
                setError("Failed to create account.");
            }
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                    <p className="text-sm text-gray-500">
                        Enter your email below to create your account
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Company Name</label>
                        <Input
                            type="text"
                            {...register("companyName")}
                        />
                        {errors.companyName?.message && (
                            <p className="text-sm text-red-500 mt-1">{errors.companyName.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <Input
                            type="text"
                            {...register("fullName")}
                        />
                        {errors.fullName?.message && (
                            <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                            type="email"
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
                        Sign Up
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

                <div className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

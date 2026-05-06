"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

const schema = z.object({
    email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
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
        setStatus("idle");
        setMessage("");
        try {
            await api.post("/auth/forgot-password", data);
            setStatus("success");
            setMessage("If an account exists, we sent a reset link to your email.");
        } catch (err: unknown) {
            setStatus("error");
            setMessage(getErrorMessage(err, "Failed to send reset link."));
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-sm space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
                    <p className="text-sm text-gray-500">
                        Enter your email address and we will send you a link to reset your password
                    </p>
                </div>

                {status === "success" ? (
                    <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">
                        {message}
                        <div className="mt-4">
                            <Link href="/login" className="font-semibold text-blue-600">
                                Back to Login
                            </Link>
                        </div>
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
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <Input
                                    type="email"
                                    {...register("email")}
                                />
                                {errors.email?.message && (
                                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" isLoading={isSubmitting}>
                                Send Reset Link
                            </Button>
                        </form>

                        <div className="text-center text-sm">
                            <Link href="/login" className="text-gray-500 hover:text-gray-900">
                                Back to Login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

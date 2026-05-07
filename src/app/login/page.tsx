"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/components/providers/language-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import Image from "next/image";
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
    const { locale, setLocale } = useLanguage();
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
        <div className="relative min-h-screen overflow-hidden bg-[#f7f1e7] px-4 py-10 text-slate-900">
            <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -top-24 right-[12%] h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
                <div className="absolute bottom-[12%] left-[8%] h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_35%)]" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col">
                <header className="flex items-center justify-between py-3">
                    <Link href="/" aria-label="golem.mx - Go to home">
                        <Image src="/golem-logo.svg" alt="golem.mx" width={168} height={44} className="h-auto w-[168px]" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/70 p-1 shadow-sm backdrop-blur">
                            <button
                                type="button"
                                onClick={() => setLocale("en")}
                                aria-pressed={locale === "en"}
                                className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${locale === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                <Image src="/flags/us.svg" alt="USA flag" width={18} height={12} className="h-3 w-[18px] rounded-[1px] object-cover" />
                                <span>EN</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocale("es")}
                                aria-pressed={locale === "es"}
                                className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${locale === "es" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                <Image src="/flags/mx.svg" alt="Mexico flag" width={18} height={12} className="h-3 w-[18px] rounded-[1px] object-cover" />
                                <span>ES</span>
                            </button>
                        </div>
                        <Link href="/register" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                            {locale === "es" ? "Crear cuenta" : "Create account"}
                        </Link>
                    </div>
                </header>

                <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center">
                <section className="relative mx-auto w-full max-w-xl perspective-[1200px]">
                    <div className="rounded-[30px] bg-[#151515] p-3 shadow-[0_28px_90px_rgba(54,38,18,0.22),0_30px_80px_rgba(0,0,0,0.28)] animate-[auth-panel-settle_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards]">
                        <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.84))] p-6 shadow-inner sm:p-7">
                            <div className="mb-5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                                <span>{locale === "es" ? "Iniciar sesion" : "Sign in"}</span>
                                <span>{locale === "es" ? "Acceso en vivo" : "Live access"}</span>
                            </div>

                            <div className="space-y-2 text-center sm:text-left">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-950">{locale === "es" ? "Bienvenido de nuevo" : "Welcome back"}</h2>
                                <p className="text-sm text-slate-500">{locale === "es" ? "Ingresa tus credenciales para acceder a tu espacio de trabajo." : "Enter your credentials to access your workspace."}</p>
                            </div>

                            {error && (
                                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="m@example.com"
                                        {...register("email")}
                                        className="border-black/10 bg-white/90 shadow-sm"
                                    />
                                    {errors.email?.message && (
                                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">{locale === "es" ? "Contrasena" : "Password"}</label>
                                    <Input
                                        type="password"
                                        {...register("password")}
                                        className="border-black/10 bg-white/90 shadow-sm"
                                    />
                                    {errors.password?.message && (
                                        <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                                    )}
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" {...register("remember_me")} />
                                    {locale === "es" ? "Recordarme" : "Remember me"}
                                </label>
                                <Button type="submit" className="w-full bg-slate-950 text-white hover:bg-slate-800" isLoading={isSubmitting}>
                                    {locale === "es" ? "Iniciar sesion" : "Sign In"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-black/10 bg-white/80"
                                    onClick={() => {
                                        window.location.href = authApi.googleLoginURL();
                                    }}
                                >
                                    {locale === "es" ? "Continuar con Google" : "Continue with Google"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-black/10 bg-white/80"
                                    onClick={() => {
                                        window.location.href = authApi.microsoftLoginURL();
                                    }}
                                >
                                    {locale === "es" ? "Continuar con Microsoft" : "Continue with Microsoft"}
                                </Button>
                            </form>

                            <div className="mt-6 text-center text-sm sm:text-left">
                                <p className="text-slate-500">
                                    {locale === "es" ? "No tienes cuenta?" : "Don&apos;t have an account?"}{" "}
                                    <Link href="/register" className="font-semibold text-slate-900 hover:text-slate-700">
                                        {locale === "es" ? "Registrate" : "Sign up"}
                                    </Link>
                                </p>
                                <p className="mt-2">
                                    <Link href="/forgot-password" className="text-slate-500 underline hover:text-slate-900">
                                        {locale === "es" ? "Olvidaste tu contrasena?" : "Forgot your password?"}
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                </div>

                <footer className="flex items-center justify-between border-t border-black/8 py-4 text-sm text-slate-500">
                    <span>&copy; {new Date().getFullYear()} golem.mx</span>
                    <Link href="/" className="transition hover:text-slate-900">
                        {locale === "es" ? "Volver al sitio" : "Back to site"}
                    </Link>
                </footer>
            </div>
        </div>
    );
}

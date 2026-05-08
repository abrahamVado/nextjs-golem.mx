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

export function RegisterPageLegacy() {
    const { register: registerAuth } = useAuth();
    const { locale, setLocale } = useLanguage();
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
                name: data.fullName,
            });
            setError("Registration request reached the Go backend, but the register flow is still scaffolded there.");
        } catch (err: unknown) {
            const maybeErr = err as {
                response?: {
                    data?: {
                        message?: string;
                        error?: {
                            message?: string;
                        };
                    };
                };
            };
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
        <div className="relative min-h-screen overflow-hidden bg-[#f7f1e7] px-4 py-10 text-slate-900">
            <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute top-[10%] right-[8%] h-60 w-60 rounded-full bg-orange-200/45 blur-3xl" />
                <div className="absolute bottom-[8%] left-[10%] h-64 w-64 rounded-full bg-sky-200/45 blur-3xl" />
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
                        <Link href="/login" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950">
                            {locale === "es" ? "Iniciar sesion" : "Sign in"}
                        </Link>
                    </div>
                </header>

                <div className="grid min-h-[calc(100vh-9rem)] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                    <section className="space-y-5">
                        <div className="space-y-4">
                            <h1 className="max-w-xl text-4xl font-black tracking-[-0.07em] text-slate-950 sm:text-5xl">
                                {locale === "es" ? "Lanza tu helpdesk y flujo de trabajo con una sola cuenta." : "Launch your helpdesk and workflow hub with one account."}
                            </h1>
                            <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                                {locale === "es" ? "Crea tu espacio de trabajo para recibir tickets, organizar proyectos y coordinar a tu equipo con visibilidad operativa compartida desde el primer dia." : "Create your workspace to receive tickets, organize projects, and coordinate your team with shared operational visibility from day one."}
                            </p>
                        </div>
                    </section>

                    <section className="relative mx-auto w-full max-w-2xl perspective-[1200px]">
                        <div className="rounded-[30px] bg-[#151515] p-3 shadow-[0_28px_90px_rgba(54,38,18,0.22),0_30px_80px_rgba(0,0,0,0.28)] animate-[auth-panel-settle_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards]">
                            <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.84))] p-6 shadow-inner sm:p-7">
                                <div className="mb-5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                                    <span>{locale === "es" ? "Registro" : "Register"}</span>
                                    <span>{locale === "es" ? "Nuevo espacio" : "New workspace"}</span>
                                </div>

                                <div className="space-y-2 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">{locale === "es" ? "Crear una cuenta" : "Create an account"}</h2>
                                    <p className="text-sm text-slate-500">{locale === "es" ? "Configura el espacio de trabajo de tu empresa e invita a tu equipo despues." : "Set up your company workspace and invite your team later."}</p>
                                </div>

                                {error && (
                                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{locale === "es" ? "Nombre de la empresa" : "Company Name"}</label>
                                            <Input type="text" {...register("companyName")} className="border-black/10 bg-white/90 shadow-sm" />
                                            {errors.companyName?.message && (
                                                <p className="mt-1 text-sm text-red-500">{errors.companyName.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{locale === "es" ? "Nombre completo" : "Full Name"}</label>
                                            <Input type="text" {...register("fullName")} className="border-black/10 bg-white/90 shadow-sm" />
                                            {errors.fullName?.message && (
                                                <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                        <Input type="email" {...register("email")} className="border-black/10 bg-white/90 shadow-sm" />
                                        {errors.email?.message && (
                                            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{locale === "es" ? "Contrasena" : "Password"}</label>
                                            <Input type="password" {...register("password")} className="border-black/10 bg-white/90 shadow-sm" />
                                            {errors.password?.message && (
                                                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">{locale === "es" ? "Confirmar contrasena" : "Confirm Password"}</label>
                                            <Input type="password" {...register("confirmPassword")} className="border-black/10 bg-white/90 shadow-sm" />
                                            {errors.confirmPassword?.message && (
                                                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full bg-slate-950 text-white hover:bg-slate-800" isLoading={isSubmitting}>
                                        {locale === "es" ? "Crear cuenta" : "Sign Up"}
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

                                <div className="mt-6 text-center text-sm text-slate-500 sm:text-left">
                                    {locale === "es" ? "Ya tienes una cuenta?" : "Already have an account?"}{" "}
                                    <Link href="/login" className="font-semibold text-slate-900 hover:text-slate-700">
                                        {locale === "es" ? "Iniciar sesion" : "Sign in"}
                                    </Link>
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

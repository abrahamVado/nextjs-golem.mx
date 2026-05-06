'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DashboardCanvas({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'relative min-h-screen overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(135deg,#eef5f3_0%,#f8fbfa_46%,#eef7ff_100%)] p-4 md:p-8',
                className
            )}
        >
            {children}
        </div>
    );
}

export function DashboardContent({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={cn('mx-auto max-w-[1440px] space-y-5', className)}>{children}</div>;
}

export function DashboardHero({
    eyebrow,
    title,
    description,
    right,
    className,
}: {
    eyebrow: ReactNode;
    title: ReactNode;
    description: ReactNode;
    right?: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl', className)}>
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-emerald-200/40" />
            <div className="pointer-events-none absolute bottom-[-100px] right-32 h-52 w-52 rounded-full bg-blue-200/40" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-2 lg:items-start">
                <div className="max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                        {eyebrow}
                    </div>
                    <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.08em] text-slate-950 md:text-6xl">{title}</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{description}</p>
                </div>
                {right ? right : null}
            </div>
        </section>
    );
}

export function DashboardSurface({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return <section className={cn('rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur', className)}>{children}</section>;
}

export function DashboardToolbar({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'grid gap-4 rounded-[22px] border border-slate-200 bg-white/85 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur md:grid-cols-[1fr_auto] md:items-center',
                className
            )}
        >
            {children}
        </section>
    );
}

export function DashboardBadge({
    children,
    tone = 'emerald',
    className,
}: {
    children: ReactNode;
    tone?: 'emerald' | 'blue' | 'red' | 'amber' | 'violet' | 'slate';
    className?: string;
}) {
    const toneClass = {
        emerald: 'bg-emerald-100 text-emerald-700',
        blue: 'bg-blue-100 text-blue-700',
        red: 'bg-red-100 text-red-700',
        amber: 'bg-amber-100 text-amber-800',
        violet: 'bg-violet-100 text-violet-700',
        slate: 'bg-slate-100 text-slate-700',
    }[tone];

    return <div className={cn('rounded-full px-3 py-1.5 text-xs font-extrabold', toneClass, className)}>{children}</div>;
}

export function DashboardStatCard({
    label,
    value,
    hint,
}: {
    label: ReactNode;
    value: ReactNode;
    hint: ReactNode;
}) {
    return (
        <div className="rounded-[20px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</div>
            <p className="mt-2 text-sm font-semibold text-slate-500">{hint}</p>
        </div>
    );
}

export function DashboardSectionHeading({
    title,
    description,
    action,
}: {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
                {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
            </div>
            {action ? action : null}
        </div>
    );
}

export function DashboardEmpty({
    title,
    description,
    action,
}: {
    title: ReactNode;
    description: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="grid place-items-center px-6 py-20 text-center">
            <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

export function DashboardNotice({
    children,
    tone = 'amber',
    className,
}: {
    children: ReactNode;
    tone?: 'amber' | 'red' | 'emerald' | 'blue';
    className?: string;
}) {
    const toneClass = {
        amber: 'border-amber-200 bg-amber-50 text-amber-900',
        red: 'border-red-200 bg-red-50 text-red-700',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
    }[tone];
    return <div className={cn('rounded-[20px] border px-5 py-4 text-sm', toneClass, className)}>{children}</div>;
}

export function DashboardModalFrame({
    children,
    width = 'max-w-[560px]',
}: {
    children: ReactNode;
    width?: string;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className={cn('w-full overflow-auto rounded-[28px] border border-white/40 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.2)]', width)}>
                {children}
            </div>
        </div>
    );
}

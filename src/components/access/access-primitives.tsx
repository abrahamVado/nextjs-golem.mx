'use client';

import { ReactNode, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

export function useAccessPageAnimation(dependencyKey = '') {
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!rootRef.current) return;

        const ctx = gsap.context(() => {
            gsap.set('[data-access-float]', { opacity: 0, y: 28 });
            gsap.to('[data-access-float]', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.08,
                clearProps: 'all',
            });

            gsap.fromTo(
                '[data-access-glow]',
                { opacity: 0, scale: 0.92 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 1.1,
                    ease: 'power2.out',
                    stagger: 0.12,
                }
            );
        }, rootRef);

        return () => ctx.revert();
    }, [dependencyKey]);

    return rootRef;
}

export function AccessHero({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
}) {
    return (
        <section
            data-access-float
            className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_40%),linear-gradient(135deg,#fffdf7_0%,#ffffff_42%,#ecfeff_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
        >
            <div data-access-glow className="pointer-events-none absolute -right-14 top-0 h-32 w-32 rounded-full bg-cyan-300/30 blur-3xl" />
            <div data-access-glow className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-amber-300/30 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-3">
                    <div className="inline-flex rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {eyebrow}
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{title}</h1>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">{description}</p>
                </div>
                {actions ? <div className="relative flex flex-wrap gap-3">{actions}</div> : null}
            </div>
        </section>
    );
}

export function AccessSurface({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            data-access-float
            className={cn(
                'rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur',
                className
            )}
        >
            {children}
        </section>
    );
}

export function AccessStat({
    label,
    value,
    hint,
}: {
    label: string;
    value: ReactNode;
    hint: string;
}) {
    return (
        <div
            data-access-float
            className="rounded-[22px] border border-slate-200 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
        >
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</div>
            <div className="mt-3 text-2xl font-semibold text-slate-950">{value}</div>
            <div className="mt-2 text-sm text-slate-600">{hint}</div>
        </div>
    );
}

export function AccessPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'info' | 'success' | 'warn' }) {
    const toneClass = {
        neutral: 'border-slate-200 bg-slate-100 text-slate-700',
        info: 'border-cyan-200 bg-cyan-50 text-cyan-700',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warn: 'border-amber-200 bg-amber-50 text-amber-800',
    }[tone];

    return (
        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', toneClass)}>
            {children}
        </span>
    );
}

export function AccessEmpty({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        </div>
    );
}

export function AccessJsonPanel({
    title,
    description,
    payload,
}: {
    title: string;
    description: string;
    payload: unknown;
}) {
    return (
        <AccessSurface>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{description}</p>
                </div>
                <AccessPill tone="info">Live payload</AccessPill>
            </div>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-[18px] bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
                {JSON.stringify(payload, null, 2)}
            </pre>
        </AccessSurface>
    );
}

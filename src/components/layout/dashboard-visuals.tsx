'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ensureGSAP } from '@/lib/gsap';

export function useDashboardMotion(dependencyKey = '') {
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!rootRef.current) return;

        const gsap = ensureGSAP();
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        const ctx = gsap.context(() => {
            const hero = rootRef.current?.querySelector('[data-dashboard-hero]');
            const statTargets = gsap.utils.toArray<HTMLElement>('[data-dashboard-stat]');
            const glowTargets = gsap.utils.toArray<HTMLElement>('[data-dashboard-glow]');

            if (hero) {
                gsap.fromTo(hero, {
                    opacity: 0,
                    y: 30,
                    scale: 0.985,
                }, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.9,
                    ease: 'power3.out',
                    clearProps: 'opacity,transform',
                });

                gsap.fromTo('[data-dashboard-hero-copy] > *', {
                    opacity: 0,
                    y: 20,
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    stagger: 0.08,
                    ease: 'power2.out',
                    delay: 0.1,
                    clearProps: 'opacity,transform',
                });
            }

            if (glowTargets.length > 0) {
                gsap.fromTo(glowTargets, {
                    opacity: 0,
                    scale: 0.88,
                }, {
                    opacity: 1,
                    scale: 1,
                    duration: 1,
                    stagger: 0.12,
                    ease: 'power2.out',
                });

                glowTargets.forEach((target, index) => {
                    gsap.to(target, {
                        y: index % 2 === 0 ? 16 : -12,
                        x: index % 2 === 0 ? -10 : 8,
                        duration: 5 + index,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                    });
                });
            }

            if (statTargets.length > 0) {
                gsap.fromTo(statTargets, {
                    opacity: 0,
                    y: 26,
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.68,
                    stagger: 0.08,
                    ease: 'power3.out',
                    clearProps: 'opacity,transform',
                    scrollTrigger: {
                        trigger: statTargets[0],
                        start: 'top 88%',
                        once: true,
                    },
                });
            }

        }, rootRef);

        return () => ctx.revert();
    }, [dependencyKey]);

    return rootRef;
}

export function DashboardCanvas({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            data-dashboard-canvas
            className={cn(
                'relative min-h-screen overflow-hidden rounded-[32px] bg-background p-4 md:p-8',
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
    size = 'default',
    className,
}: {
    eyebrow: ReactNode;
    title: ReactNode;
    description: ReactNode;
    right?: ReactNode;
    size?: 'default' | 'compact';
    className?: string;
}) {
    const compact = size === 'compact';

    return (
        <section data-dashboard-hero className={cn(
            'relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl',
            compact ? 'p-3 md:p-4' : 'p-4 md:p-5',
            className
        )}>
            <div data-dashboard-glow className={cn(
                'pointer-events-none absolute rounded-full bg-emerald-200/40',
                compact ? '-right-8 -top-10 h-24 w-24' : '-right-10 -top-14 h-40 w-40'
            )} />
            <div data-dashboard-glow className={cn(
                'pointer-events-none absolute rounded-full bg-blue-200/40',
                compact ? 'bottom-[-32px] right-12 h-16 w-16' : 'bottom-[-56px] right-20 h-28 w-28'
            )} />
            <div className={cn('relative z-10 grid lg:grid-cols-2 lg:items-start', compact ? 'gap-3' : 'gap-4')}>
                <div data-dashboard-hero-copy className="max-w-3xl">
                    <div className={cn(
                        'inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 font-extrabold uppercase tracking-[0.18em] text-emerald-700',
                        compact ? 'mb-2 text-[9px]' : 'mb-3 text-[10px]'
                    )}>
                        {eyebrow}
                    </div>
                    <h1 className={cn(
                        'max-w-4xl font-semibold tracking-[-0.08em] text-slate-950',
                        compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'
                    )}>{title}</h1>
                    <p className={cn(
                        'max-w-2xl text-slate-600',
                        compact ? 'mt-2 text-xs leading-5 md:text-sm' : 'mt-3 text-sm leading-6'
                    )}>{description}</p>
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
        <div data-dashboard-stat className="rounded-[20px] border border-slate-200 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
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

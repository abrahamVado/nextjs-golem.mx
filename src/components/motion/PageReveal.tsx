'use client';

import { ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useGsapReveal } from '@/hooks/use-gsap-reveal';

export function PageReveal({
    children,
    className,
    dependencyKey = '',
}: {
    children: ReactNode;
    className?: string;
    dependencyKey?: string;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    useGsapReveal(ref, { dependencyKey });

    return (
        <div ref={ref} className={cn(className)}>
            {children}
        </div>
    );
}

export function RevealItem({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div data-gsap-reveal className={className}>
            {children}
        </div>
    );
}

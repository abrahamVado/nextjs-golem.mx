'use client';

import { RefObject, useEffect } from 'react';
import { ensureGSAP } from '@/lib/gsap';

type RevealOptions = {
    selector?: string;
    y?: number;
    stagger?: number;
    duration?: number;
    dependencyKey?: string;
};

export function useGsapReveal<T extends HTMLElement>(
    ref: RefObject<T | null>,
    {
        selector = '[data-gsap-reveal]',
        y = 24,
        stagger = 0.08,
        duration = 0.72,
        dependencyKey = '',
    }: RevealOptions = {}
) {
    useEffect(() => {
        if (!ref.current) return;

        const gsap = ensureGSAP();
        const ctx = gsap.context(() => {
            gsap.fromTo(
                selector,
                { opacity: 0, y },
                {
                    opacity: 1,
                    y: 0,
                    duration,
                    stagger,
                    ease: 'power3.out',
                    clearProps: 'opacity,transform',
                }
            );
        }, ref);

        return () => ctx.revert();
    }, [ref, selector, y, stagger, duration, dependencyKey]);
}

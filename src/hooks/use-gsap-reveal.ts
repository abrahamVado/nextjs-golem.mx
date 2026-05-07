'use client';

import { RefObject, useEffect } from 'react';
import { ensureGSAP } from '@/lib/gsap';

type RevealOptions = {
    selector?: string;
    y?: number;
    stagger?: number;
    duration?: number;
    dependencyKey?: string;
    start?: string;
};

export function useGsapReveal<T extends HTMLElement>(
    ref: RefObject<T | null>,
    {
        selector = '[data-gsap-reveal]',
        y = 24,
        stagger = 0.08,
        duration = 0.72,
        dependencyKey = '',
        start = 'top 86%',
    }: RevealOptions = {}
) {
    useEffect(() => {
        if (!ref.current) return;

        const gsap = ensureGSAP();
        const ctx = gsap.context(() => {
            const targets = gsap.utils.toArray<HTMLElement>(selector);
            if (targets.length === 0) return;

            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduceMotion) {
                gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
                return;
            }

            gsap.fromTo(targets, {
                opacity: 0,
                y,
            }, {
                opacity: 1,
                y: 0,
                duration,
                stagger,
                ease: 'power3.out',
                clearProps: 'opacity,transform',
                scrollTrigger: {
                    trigger: ref.current,
                    start,
                    once: true,
                },
            });
        }, ref);

        return () => ctx.revert();
    }, [ref, selector, y, stagger, duration, dependencyKey, start]);
}

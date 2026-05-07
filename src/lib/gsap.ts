'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let initialized = false;

export function ensureGSAP() {
    if (initialized) return gsap;
    initialized = true;
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({
        nullTargetWarn: false,
    });
    return gsap;
}

export { gsap };

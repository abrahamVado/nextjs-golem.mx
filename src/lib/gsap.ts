'use client';

import gsap from 'gsap';

let initialized = false;

export function ensureGSAP() {
    if (initialized) return gsap;
    initialized = true;
    gsap.config({
        nullTargetWarn: false,
        trialWarn: false,
    });
    return gsap;
}

export { gsap };

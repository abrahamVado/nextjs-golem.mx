'use client';

import { createContext, useContext, useEffect } from 'react';
import { ensureGSAP, gsap } from '@/lib/gsap';

const GSAPContext = createContext(gsap);

export function GSAPProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        ensureGSAP();
    }, []);

    return <GSAPContext.Provider value={gsap}>{children}</GSAPContext.Provider>;
}

export function useGSAPInstance() {
    return useContext(GSAPContext);
}

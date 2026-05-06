"use client";

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { modules } from '@/modules/registry_gen';
import PageRenderer from '@/components/modules/PageRenderer';

export default function ModuleCatchAllPage() {
    const pathname = usePathname();
    const viewKey = useMemo(() => {
        for (const mod of modules) {
            if (!mod.frontend?.routes) continue;
            const match = mod.frontend.routes.find((route) => route.path === pathname);
            if (match) return match.viewKey;
        }
        return null;
    }, [pathname]);

    if (!viewKey) {
        return (
            <div className="flex h-full flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-gray-300">404</h1>
                <p className="text-gray-500">Module route not found.</p>
            </div>
        );
    }

    return <PageRenderer viewKey={viewKey} />;
}

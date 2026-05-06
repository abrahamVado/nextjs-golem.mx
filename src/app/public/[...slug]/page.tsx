"use client";

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { modules } from '@/modules/registry_gen';
import PageRenderer from '@/components/modules/PageRenderer';

// Helper to convert route path (e.g. /public/careers/:id) to regex
function routeToRegex(routePath: string): RegExp {
    // Escape special regex chars except param delimiters
    let pattern = routePath.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Replace :param with named capture group NOT strictly needed for matching, 
    // just needs to match non-slash characters.
    // simpler: replace /:([^/]+) with /([^/]+)
    pattern = pattern.replace(/:[^/]+/g, '([^/]+)');
    // Ensure separate segments and end of string
    return new RegExp(`^${pattern}$`);
}

export default function PublicCatchAllPage() {
    const pathname = usePathname();
    const viewKey = useMemo(() => {
        for (const mod of modules) {
            if (!mod.frontend?.routes) continue;

            for (const route of mod.frontend.routes) {
                if (route.path === pathname) return route.viewKey;
                if (route.path.includes(':') && routeToRegex(route.path).test(pathname)) {
                    return route.viewKey;
                }
            }
        }
        return null;
    }, [pathname]);

    if (!viewKey) {
        return (
            <div className="flex h-full flex-col items-center justify-center py-20">
                <h1 className="text-4xl font-bold text-gray-300">404</h1>
                <p className="text-gray-500">Page not found.</p>
            </div>
        );
    }

    return <PageRenderer viewKey={viewKey} />;
}

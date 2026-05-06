"use client";

import React, { useEffect, useState } from 'react';
import { moduleLoader } from '@/modules/loader';
import { Loader2 } from 'lucide-react';

interface PageRendererProps {
    viewKey: string;
}

type ModuleViewComponent = React.ComponentType<Record<string, never>>;

export default function PageRenderer({ viewKey }: PageRendererProps) {
    const [Component, setComponent] = useState<ModuleViewComponent | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadView = async () => {
            try {
                // Ensure the module is loaded (init usually called at app level, but let's be safe)
                // Actually, moduleLoader.init() calls dynamic imports.
                // But specifically for this view, we need the module entry.
                await moduleLoader.init();

                const View = moduleLoader.getView(viewKey);
                if (!View) {
                    throw new Error(`View '${viewKey}' not found in any loaded module.`);
                }
                setComponent(() => View as ModuleViewComponent);
            } catch (err: unknown) {
                console.error("Failed to load view:", err);
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
            }
        };

        loadView();
    }, [viewKey]);

    if (error) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-red-500">
                <p>Error loading module view:</p>
                <p className="font-mono text-sm">{error}</p>
            </div>
        );
    }

    if (!Component) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return <Component />;
}

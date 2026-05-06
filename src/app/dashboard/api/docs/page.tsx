'use client';

import { DashboardCanvas, DashboardContent, DashboardHero, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/lib/api';

function resolveDocsURL(): { docsUI: string; openapi: string } {
    try {
        const apiURL = new URL(API_BASE_URL);
        const docsUI = `${apiURL.origin}/api/docs`;
        return {
            docsUI,
            openapi: `${apiURL.origin}/api/v1/openapi.json`,
        };
    } catch {
        return {
            docsUI: '/api/docs',
            openapi: '/api/v1/openapi.json',
        };
    }
}

export default function APIDocsPage() {
    const { docsUI, openapi } = resolveDocsURL();

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />API Docs</>}
                    title="Documentation with the shared dashboard visual language"
                    description="Open the generated OpenAPI spec and interactive docs from a page that now matches the rest of the control-room style."
                />

            <div className="dashboard-grid lg:grid-cols-2">
                <DashboardSurface className="space-y-3">
                    <h3 className="text-base font-semibold">Interactive Docs</h3>
                    <p className="text-sm text-muted-foreground">
                        Swagger UI served by the backend.
                    </p>
                    <Button asChild>
                        <a href={docsUI} target="_blank" rel="noreferrer">Open /api/docs</a>
                    </Button>
                </DashboardSurface>

                <DashboardSurface className="space-y-3">
                    <h3 className="text-base font-semibold">OpenAPI JSON</h3>
                    <p className="text-sm text-muted-foreground">
                        Machine-readable API contract used for integrations and CI drift checks.
                    </p>
                    <Button variant="outline" asChild>
                        <a href={openapi} target="_blank" rel="noreferrer">Open /api/v1/openapi.json</a>
                    </Button>
                </DashboardSurface>
            </div>
            </DashboardContent>
        </DashboardCanvas>
    );
}

"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/context/AuthContext";
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardNotice, DashboardSurface, useDashboardMotion } from "@/components/layout/dashboard-visuals";

type DashboardSummary = {
    company_id: string;
    generated_at: string;
    project_count: number;
    task_count: number;
    team_member_count: number;
    completed_task_count: number;
    completion_rate: number;
    task_status: { key: string; label: string; count: number }[];
    project_activity: { name: string; tasks: number }[];
    recent_projects: { id: string; name: string; description?: string; icon?: string; created_at?: string; task_count: number }[];
};

function formatPercent(value: number) {
    return `${Math.round(value * 100)}%`;
}

function formatShortDate(value?: string) {
    if (!value) return "Waiting";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Waiting";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const motionRef = useDashboardMotion(`${Boolean(user?.id)}:${Boolean(summary)}:${isLoading}`);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await dashboardApi.getSummary();
                if (!active) return;
                setSummary(response.data.data);
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, "Failed to load dashboard summary."));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    return (
        <DashboardCanvas>
            <DashboardContent className="relative">
                <div ref={motionRef}>
                    <DashboardHero
                        eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Operations</>}
                        title="A live dashboard for delivery, workload, and team momentum"
                        description="This view now focuses on real operational signals from your company data: how much work exists, where tasks are concentrated, which projects carry the load, and how much has actually been completed."
                        right={
                            <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                                {summary ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div data-dashboard-stat className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Top Project</div>
                                            <div className="mt-2 text-sm font-semibold text-slate-900">{summary.project_activity?.[0]?.name || "No active projects"}</div>
                                        </div>
                                        <div data-dashboard-stat className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Completion</div>
                                            <div className="mt-2 text-sm font-semibold text-emerald-700">{formatPercent(summary.completion_rate)}</div>
                                        </div>
                                        <div data-dashboard-stat className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Company</div>
                                            <div className="mt-2 text-sm font-semibold text-slate-900">{summary.company_id.slice(0, 8)}</div>
                                        </div>
                                        <div data-dashboard-stat className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Updated</div>
                                            <div className="mt-2 text-sm font-semibold text-slate-900">{formatShortDate(summary.generated_at)}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500">{isLoading ? "Loading live snapshot..." : "No snapshot available."}</div>
                                )}
                            </DashboardSurface>
                        }
                    />

                    {error ? <DashboardNotice tone="red">{error}</DashboardNotice> : null}
                </div>
            </DashboardContent>
        </DashboardCanvas>
    );
}

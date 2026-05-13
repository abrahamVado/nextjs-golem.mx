"use client";

import { useEffect, useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/context/AuthContext";
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardModalFrame, DashboardNotice, DashboardSurface, useDashboardMotion } from "@/components/layout/dashboard-visuals";

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

type SystemLogEntry = {
    id: string;
    timestamp: string;
    action: string;
    resource: string;
    actor_name?: string;
    ip_address?: string;
    user_agent?: string;
    message: string;
    severity: "info" | "warn" | "error" | "success" | string;
};

type FlowSeries = {
    label: string;
    color: string;
    fill: string;
    points: number[];
};

type MemberActivitySeries = {
    label: string;
    color: string;
    points: Array<number | null>;
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

function formatLogTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--:--";
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

function severityTone(severity: string) {
    switch (severity) {
        case "error":
            return "text-[#ef4444]";
        case "warn":
            return "text-[#f59e0b]";
        case "success":
            return "text-[#22c55e]";
        case "info":
            return "text-[#3b82f6]";
        default:
            return "text-[#8b5cf6]";
    }
}

function severityPrefix(severity: string) {
    switch (severity) {
        case "error":
            return "[ERR]";
        case "warn":
            return "[WRN]";
        case "success":
            return "[OK ]";
        case "info":
            return "[INF]";
        default:
            return "[SYS]";
    }
}

function SystemLogsTerminal({
    logs,
    emptyMessage,
    compact = false,
}: {
    logs: SystemLogEntry[];
    emptyMessage: string;
    compact?: boolean;
}) {
    return (
        <div className={compact ? "max-h-[340px] overflow-y-auto" : "max-h-[70vh] overflow-y-auto"}>
            {logs.length === 0 ? (
                <div className="font-mono text-[11px] leading-6 text-slate-400">{emptyMessage}</div>
            ) : (
                <div className="space-y-[3px] font-mono text-[11px] leading-6 text-slate-200">
                    {logs.map((log) => (
                        <div key={log.id} className="grid grid-cols-[68px_46px_1fr] gap-3">
                            <span className="text-slate-500">{formatLogTime(log.timestamp)}</span>
                            <span className={severityTone(log.severity)}>{severityPrefix(log.severity)}</span>
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                <span className="text-slate-100">{log.message}</span>
                                {(log.resource || log.ip_address) ? (
                                    <span className="ml-2 text-slate-500">
                                        {log.resource ? `(${log.resource}` : "("}
                                        {log.resource && log.ip_address ? " · " : ""}
                                        {log.ip_address || ""}
                                        )
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function buildSeriesPath(points: Array<number | null>, maxValue: number) {
    const width = 260;
    const height = 120;
    const stepX = width / Math.max(points.length - 1, 1);
    const normalized = points.map((point, index) => {
        const safePoint = point ?? 0;
        const x = index * stepX;
        const y = height - (maxValue === 0 ? 0 : (safePoint / maxValue) * height);
        return `${x},${y}`;
    });
    return normalized.join(" ");
}

function CumulativeFlowChart({ series }: { series: MemberActivitySeries[] }) {
    const labels = ["M", "T", "W", "T", "F", "S", "S"];

    const intensityForHour = (hour: number | null) => {
        if (hour == null) return 0;
        if (hour < 8) return 1;
        if (hour < 12) return 2;
        if (hour < 17) return 3;
        return 4;
    };

    const cellTone = (color: string, intensity: number) => {
        if (intensity === 0) return "#e5edf6";
        if (intensity === 1) return `${color}26`;
        if (intensity === 2) return `${color}4d`;
        if (intensity === 3) return `${color}80`;
        return color;
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex-1 p-1">
                <div className="grid gap-2">
                    <div className="grid grid-cols-[90px_1fr] items-center gap-x-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Members</span>
                        <div className="grid grid-cols-7 gap-2 font-mono text-[10px] font-medium text-slate-500">
                            {labels.map((label) => (
                                <span key={label} className="text-center">{label}</span>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        {series.map((item) => (
                            <div key={item.label} className="grid grid-cols-[90px_1fr] items-center gap-x-3">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="h-[10px] w-[10px] shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
                                    <span className="truncate font-mono text-[10px] text-slate-700">{item.label}</span>
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {item.points.map((point, index) => (
                                        <div key={`${item.label}-${index}`} className="space-y-1">
                                            <div
                                                className="h-7 rounded-[6px] border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                                                style={{ backgroundColor: cellTone(item.color, intensityForHour(point)) }}
                                            />
                                            <div className="text-center font-mono text-[8px] text-slate-400">
                                                {point == null ? "--" : `${Math.round(point)}h`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CumulativeFlowWindow({
    series,
    loading,
}: {
    series: MemberActivitySeries[];
    loading: boolean;
}) {
    return (
        <section className="overflow-hidden rounded-[10px] border border-[#d6dbe3] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.12)] xl:col-span-2">
            <div className="flex items-center gap-2 border-b border-[#d6dbe3] bg-[#f5f9ff] px-3 py-2">
                <div className="flex gap-[6px]">
                    <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                    <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
                </div>
                <span className="ml-2 flex-1 truncate font-mono text-[11px] text-slate-500">CUMULATIVE FLOW</span>
            </div>
            <div className="px-4 pb-4 pt-3">
                <div className="pb-2 font-mono text-[11px] text-slate-500">Team activity by weekday and hour</div>
                {loading ? (
                    <div className="font-mono text-[11px] text-slate-400">Loading cumulative flow...</div>
                ) : (
                    <CumulativeFlowChart series={series} />
                )}
            </div>
        </section>
    );
}

function LogsWindow({
    logs,
    loading,
    error,
    onMaximize,
    compact = false,
}: {
    logs: SystemLogEntry[];
    loading: boolean;
    error: string | null;
    onMaximize?: () => void;
    compact?: boolean;
}) {
    return (
        <section className="overflow-hidden rounded-[10px] border border-[#2d3748] bg-[#0a0a0a] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 border-b border-[#2d3748] bg-[#1a1a1a] px-3 py-2">
                <div className="flex gap-[6px]">
                    <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                    <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    {onMaximize ? (
                        <button
                            type="button"
                            onClick={onMaximize}
                            className="grid h-3 w-3 place-items-center rounded-full bg-[#22c55e] text-[7px] text-black/60 transition-transform hover:scale-110"
                            title="Maximize"
                        >
                            <Maximize2 className="h-2 w-2" />
                        </button>
                    ) : (
                        <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
                    )}
                </div>
                <span className="ml-2 flex-1 truncate font-mono text-[11px] text-slate-500">SYSTEM LOGS</span>
            </div>
            <div className="px-4 pb-4 pt-3">
                <div className="pb-2 font-mono text-[11px] text-slate-500">Real-time kanban engine activity</div>
                {error ? <DashboardNotice tone="red" className="mb-3 border-red-900/70 bg-red-950/40 text-red-200">{error}</DashboardNotice> : null}
                {loading ? (
                    <div className="font-mono text-[11px] text-slate-400">Loading system logs...</div>
                ) : (
                    <SystemLogsTerminal logs={logs} emptyMessage="No audit logs have been recorded for this company yet." compact={compact} />
                )}
            </div>
        </section>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [logs, setLogs] = useState<SystemLogEntry[]>([]);
    const [fullLogs, setFullLogs] = useState<SystemLogEntry[]>([]);
    const [logsOpen, setLogsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(true);
    const [fullLogsLoading, setFullLogsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logsError, setLogsError] = useState<string | null>(null);
    const motionRef = useDashboardMotion(`${Boolean(user?.id)}:${Boolean(summary)}:${isLoading}:${logs.length}:${logsOpen}`);

    useEffect(() => {
        let active = true;

        const loadSummary = async () => {
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

        void loadSummary();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadLogs = async () => {
            if (active) setLogsLoading(true);
            try {
                const response = await dashboardApi.getSystemLogs(120);
                if (!active) return;
                setLogs(response.data.data.items);
                setLogsError(null);
            } catch (requestError: unknown) {
                if (!active) return;
                setLogsError(getErrorMessage(requestError, "Failed to load system logs."));
            } finally {
                if (active) setLogsLoading(false);
            }
        };

        void loadLogs();
        const interval = window.setInterval(() => void loadLogs(), 15000);
        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!logsOpen) return;
        let active = true;

        const loadFullLogs = async () => {
            setFullLogsLoading(true);
            try {
                const response = await dashboardApi.getSystemLogs(100);
                if (!active) return;
                setFullLogs(response.data.data.items);
                setLogsError(null);
            } catch (requestError: unknown) {
                if (!active) return;
                setLogsError(getErrorMessage(requestError, "Failed to load full system logs."));
            } finally {
                if (active) setFullLogsLoading(false);
            }
        };

        void loadFullLogs();
        return () => {
            active = false;
        };
    }, [logsOpen]);

    const cumulativeFlowSeries = useMemo<MemberActivitySeries[]>(() => {
        const weekdayIndex = (timestamp: string) => {
            const day = new Date(timestamp).getDay();
            return day === 0 ? 6 : day - 1;
        };
        const palette = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444", "#14b8a6", "#eab308", "#ec4899"];
        const grouped = new Map<string, number[][]>();

        for (const log of logs) {
            const actor = log.actor_name?.trim() || "System";
            const date = new Date(log.timestamp);
            if (Number.isNaN(date.getTime())) continue;
            if (!grouped.has(actor)) {
                grouped.set(actor, [[], [], [], [], [], [], []]);
            }
            grouped.get(actor)![weekdayIndex(log.timestamp)].push(date.getHours() + date.getMinutes() / 60);
        }

        return Array.from(grouped.entries())
            .sort((a, b) => b[1].flat().length - a[1].flat().length)
            .slice(0, 6)
            .map(([actor, buckets], index) => ({
                label: actor,
                color: palette[index % palette.length],
                points: buckets.map((hours) => {
                    if (hours.length === 0) return null;
                    const avg = hours.reduce((sum, hour) => sum + hour, 0) / hours.length;
                    return Number(avg.toFixed(1));
                }),
            }));
    }, [logs]);

    return (
        <DashboardCanvas>
            <DashboardContent className="relative">
                <div ref={motionRef} className="space-y-5">
                    <DashboardHero
                        eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Operations</>}
                        title="Operational visibility across work, delivery, and team activity"
                        description="Track where work is moving, who is active, which projects are carrying the load, and how delivery is evolving across the week."
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

                    <div className="grid gap-5 xl:grid-cols-3">
                        <LogsWindow logs={logs.slice(0, 8)} loading={logsLoading} error={logsError} onMaximize={() => setLogsOpen(true)} compact />
                        <CumulativeFlowWindow series={cumulativeFlowSeries} loading={logsLoading} />
                    </div>
                </div>
            </DashboardContent>

            {logsOpen ? (
                <div onClick={() => setLogsOpen(false)}>
                    <DashboardModalFrame width="max-w-[1100px]">
                        <div onClick={(event) => event.stopPropagation()}>
                            <LogsWindow logs={fullLogs} loading={fullLogsLoading} error={logsError} compact={false} />
                        </div>
                    </DashboardModalFrame>
                </div>
            ) : null}
        </DashboardCanvas>
    );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { modules } from "@/modules/registry_gen";
import PageRenderer from "@/components/modules/PageRenderer";
import PortalTicketBlocked from "@/components/tickets/portal/PortalTicketBlocked";
import PortalTicketForm, { PortalPageData } from "@/components/tickets/portal/PortalTicketForm";
import { Loader2, Lock, Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.paladin.mx/api/v1";

function routeToRegex(routePath: string): RegExp {
    let pattern = routePath.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    pattern = pattern.replace(/:[^/]+/g, "([^/]+)");
    return new RegExp(`^${pattern}$`);
}

function matchesRegisteredModule(pathname: string): string | null {
    for (const mod of modules) {
        if (!mod.frontend?.routes) continue;

        for (const route of mod.frontend.routes) {
            if (route.path === pathname) return route.viewKey;
            if (route.path.includes(":") && routeToRegex(route.path).test(pathname)) {
                return route.viewKey;
            }
        }
    }
    return null;
}

export default function PublicCatchAllPage() {
    const pathname = usePathname();
    const params = useParams();
    const slugParts = params.slug;
    const matchedViewKey = useMemo(() => matchesRegisteredModule(pathname), [pathname]);

    const isSingleProjectPortal = Array.isArray(slugParts) && slugParts.length === 1;
    const portalSlug = isSingleProjectPortal ? String(slugParts[0]) : null;

    const [page, setPage] = useState<PortalPageData | null>(null);
    const [password, setPassword] = useState("");
    const [grantedPassword, setGrantedPassword] = useState("");
    const [isLoading, setIsLoading] = useState(Boolean(portalSlug));
    const [error, setError] = useState<string | null>(null);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    useEffect(() => {
        if (!portalSlug) return;
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/public/projects/${encodeURIComponent(portalSlug)}`, {
                    credentials: "include",
                });
                const payload = await response.json().catch(() => null);
                if (!active) return;

                if (!response.ok) {
                    setError(payload?.error || payload?.message || "Failed to load public portal.");
                    return;
                }

                const data = payload?.data || payload;
                if (data?.requires_password && !data?.project_id) {
                    setNeedsPassword(true);
                    setPage(null);
                    return;
                }

                setNeedsPassword(false);
                setGrantedPassword("");
                setPage(data as PortalPageData);
            } catch {
                if (!active) return;
                setError("Network error while loading the portal.");
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, [portalSlug]);

    const unlockPortal = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!portalSlug || !password.trim()) {
            setError("Enter the portal password to continue.");
            return;
        }

        setIsUnlocking(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/public/projects/${encodeURIComponent(portalSlug)}/access`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password: password.trim() }),
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                setError(payload?.error || payload?.message || "Incorrect password or portal unavailable.");
                return;
            }

            const data = payload?.data || payload;
            setNeedsPassword(false);
            setGrantedPassword(password.trim());
            setPage(data as PortalPageData);
        } catch {
            setError("Network error while unlocking the portal.");
        } finally {
            setIsUnlocking(false);
        }
    };

    if (!portalSlug) {
        if (!matchedViewKey) {
            return (
                <div className="flex h-full flex-col items-center justify-center py-20">
                    <h1 className="text-4xl font-bold text-gray-300">404</h1>
                    <p className="text-gray-500">Page not found.</p>
                </div>
            );
        }

        return <PageRenderer viewKey={matchedViewKey} />;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 md:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="rounded-[32px] border border-slate-200 bg-white/86 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        <Ticket className="h-3.5 w-3.5" />
                        Public support portal
                    </div>
                    <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-slate-950 md:text-5xl">
                        {page?.title || "Client intake and support request portal"}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                        Use this portal to submit support requests, share operational context, and route client issues into the current workspace workflow with less back-and-forth.
                    </p>
                </div>

                {isLoading ? (
                    <div className="rounded-[28px] border border-slate-200 bg-white/86 p-8 text-sm text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading portal experience...
                        </div>
                    </div>
                ) : error && !needsPassword ? (
                    <PortalTicketBlocked
                        title="We couldn't load this portal"
                        message={error}
                        hint="Check the portal link or contact the support team"
                    />
                ) : needsPassword ? (
                    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                        <PortalTicketBlocked
                            title="This support portal is password protected"
                            message="Enter the portal password provided by the team to continue to the request experience."
                            hint="Access is controlled before request intake opens"
                        />
                        <form onSubmit={unlockPortal} className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                            <div className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                    <Lock className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Unlock portal</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">After access is confirmed, the portal will load the current intake flow for this project.</p>
                                </div>
                                {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
                                <label className="space-y-2 block">
                                    <span className="text-sm font-medium text-slate-900">Portal password</span>
                                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
                                </label>
                                <Button type="submit" isLoading={isUnlocking} className="w-full">
                                    Continue
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : page ? (
                    <PortalTicketForm page={page} initialCompany={page.project_name} portalPassword={grantedPassword} />
                ) : null}
            </div>
        </div>
    );
}

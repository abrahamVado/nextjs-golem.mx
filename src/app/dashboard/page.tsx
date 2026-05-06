"use client";

import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardNotice, DashboardSectionHeading, DashboardStatCard, DashboardSurface } from "@/components/layout/dashboard-visuals";

type MePayload = {
    user_id: string;
    company_id: string;
    branch_id?: string | null;
};

type UsersPayload = {
    company_id: string;
    module: string;
    items: unknown[];
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [me, setMe] = useState<MePayload | null>(null);
    const [usersInfo, setUsersInfo] = useState<UsersPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [usersError, setUsersError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setProfileError(null);
            setUsersError(null);

            try {
                const meRes = await userApi.getMe();
                if (!active) return;
                setMe(meRes.data.data);
            } catch (error: unknown) {
                if (!active) return;
                setProfileError(getErrorMessage(error, "Failed to load your profile from the Go backend."));
            }

            try {
                const usersRes = await userApi.listUsers();
                if (!active) return;
                setUsersInfo(usersRes.data.data);
            } catch (error: unknown) {
                if (!active) return;
                setUsersInfo(null);
                setUsersError(getErrorMessage(error, "You are connected, but this account cannot read /users yet."));
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Dashboard</>}
                    title="A dashboard with the new control-room visual language"
                    description="This home view now uses the same hero, surfaces, palette, and rounded atmosphere as the new access area while staying connected to the live Go backend."
                    right={
                        <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">System health</div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Profile route</span>
                                    <span className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        {profileError ? "Issue" : "Live"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Users route</span>
                                    <span className="text-xs font-extrabold text-slate-600">{usersInfo ? "Accessible" : "Restricted"}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Company</span>
                                    <span className="text-xs font-extrabold text-slate-600">{me?.company_id?.slice(0, 8) || user?.company_id || "n/a"}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-slate-900">Users returned</span>
                                    <span className="text-xs font-extrabold text-blue-700">{usersInfo?.items.length || 0}</span>
                                </div>
                            </div>
                        </DashboardSurface>
                    }
                />

            {isLoading ? (
                <DashboardSurface>
                    <p className="text-sm text-gray-500">Loading backend data...</p>
                </DashboardSurface>
            ) : (
                <>
                <div className="grid gap-4 md:grid-cols-3">
                    <DashboardStatCard label="User ID" value={me?.user_id?.slice(0, 8) || user?.id || "n/a"} hint="Current authenticated identity." />
                    <DashboardStatCard label="Company" value={me?.company_id?.slice(0, 8) || user?.company_id || "n/a"} hint="Tenant scope from the backend." />
                    <DashboardStatCard label="Users route" value={usersInfo ? "Live" : "Locked"} hint="Whether this session can read the users feed." />
                </div>
                <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                    <DashboardSurface>
                        <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            This page proves the frontend is talking to the Go API using the current auth flow.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">User ID</div>
                                <div className="mt-2 break-all text-sm text-gray-900">{me?.user_id || user?.id || "Unavailable"}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Company ID</div>
                                <div className="mt-2 break-all text-sm text-gray-900">{me?.company_id || user?.company_id || "Unavailable"}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Branch ID</div>
                                <div className="mt-2 break-all text-sm text-gray-900">{me?.branch_id || user?.branch_id || "None"}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Users Route</div>
                                <div className="mt-2 text-sm text-gray-900">{usersInfo ? "Accessible" : "Restricted or unavailable"}</div>
                            </div>
                        </div>

                        {profileError ? (
                            <DashboardNotice className="mt-4" tone="red">{profileError}</DashboardNotice>
                        ) : null}
                    </DashboardSurface>

                    <aside className="space-y-6">
                        <DashboardSurface>
                            <DashboardSectionHeading title="Users Snapshot" />
                            {usersInfo ? (
                                <>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Module: <span className="font-medium text-gray-900">{usersInfo.module}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Items returned: <span className="font-medium text-gray-900">{usersInfo.items.length}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Scope company: <span className="break-all font-medium text-gray-900">{usersInfo.company_id}</span>
                                    </p>
                                </>
                            ) : (
                                <DashboardNotice className="mt-3">
                                    {usersError || "The backend denied access to /users for this account."}
                                </DashboardNotice>
                            )}
                        </DashboardSurface>

                        <DashboardSurface>
                            <DashboardSectionHeading title="Quick Links" />
                            <div className="mt-4 flex flex-col gap-3">
                                <Link href="/dashboard/settings" className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-100">
                                    Open Settings
                                </Link>
                                <Link href="/dashboard/access/users" className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-100">
                                    Open Access Users
                                </Link>
                            </div>
                        </DashboardSurface>
                    </aside>
                </div>
                </>
            )}
            </DashboardContent>
        </DashboardCanvas>
    );
}

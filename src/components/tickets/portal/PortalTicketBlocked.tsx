"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

export default function PortalTicketBlocked({
    title,
    message,
    hint,
}: {
    title: string;
    message: string;
    hint?: string;
}) {
    return (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50/90 p-6 shadow-[0_18px_48px_rgba(120,53,15,0.08)]">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-amber-950">{title}</h2>
                    <p className="text-sm leading-6 text-amber-900">{message}</p>
                    {hint ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {hint}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

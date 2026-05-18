"use client";

import { CheckCircle2, Mail, Ticket } from "lucide-react";

export default function PortalTicketConfirmation({
    title,
    description,
    ticketNumber,
}: {
    title: string;
    description: string;
    ticketNumber?: string;
}) {
    return (
        <div className="rounded-[32px] border border-emerald-200 bg-emerald-50/80 p-6 shadow-[0_18px_48px_rgba(5,150,105,0.08)]">
            <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-emerald-950">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-emerald-900">{description}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-white/85 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                            <Ticket className="h-4 w-4" />
                            Reference
                        </div>
                        <div className="mt-2 text-lg font-semibold text-emerald-950">{ticketNumber || "Created in current workspace"}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-white/85 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                            <Mail className="h-4 w-4" />
                            Next Step
                        </div>
                        <div className="mt-2 text-sm text-emerald-900">Use your portal access to continue tracking updates and follow-up context.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

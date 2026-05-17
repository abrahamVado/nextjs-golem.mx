"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardBadge, DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardNotice, DashboardSectionHeading, DashboardSurface, DashboardToolbar } from "@/components/layout/dashboard-visuals";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/errors";
import { teamApi, ticketApi } from "@/lib/api";
import { TicketListItem, TeamMember } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Search, Ticket, UserRound, Clock3, AlertTriangle } from "lucide-react";
import { formatMemberList, formatTicketDate, isTicketOverdue, memberMapFromList, ticketPriorityTone, ticketStatusTone } from "./ticket-utils";

type FilterMode = "all" | "mine" | "unassigned" | "overdue";

export default function TicketsPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterMode>("all");

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const teamsResponse = await teamApi.getMyTeams();
                const teamId = teamsResponse.data.data?.[0]?.id ?? "";

                const [nextTickets, membersResponse] = await Promise.all([
                    ticketApi.listInbox(teamId),
                    teamId ? teamApi.getMembers(teamId) : Promise.resolve({ data: { data: [] as TeamMember[] } }),
                ]);

                if (!active) return;
                setTickets(nextTickets);
                setMembers(membersResponse.data.data || []);
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, "Failed to load ticket inbox"));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    const memberNameById = useMemo(() => memberMapFromList(members), [members]);

    const filteredTickets = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return tickets.filter((ticket) => {
            const matchesFilter =
                filter === "all"
                    ? true
                    : filter === "mine"
                        ? Boolean(user?.id) && ticket.assignee_ids.includes(String(user.id))
                        : filter === "unassigned"
                            ? ticket.assignee_ids.length === 0
                            : isTicketOverdue(ticket);

            const assigneeNames = ticket.assignee_ids.map((id) => memberNameById.get(id) || id).join(" ").toLowerCase();
            const matchesQuery =
                !normalizedQuery ||
                ticket.ticket_number.toLowerCase().includes(normalizedQuery) ||
                ticket.title.toLowerCase().includes(normalizedQuery) ||
                (ticket.description || "").toLowerCase().includes(normalizedQuery) ||
                ticket.project_name.toLowerCase().includes(normalizedQuery) ||
                ticket.requester_name.toLowerCase().includes(normalizedQuery) ||
                assigneeNames.includes(normalizedQuery) ||
                ticket.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

            return matchesFilter && matchesQuery;
        });
    }, [filter, memberNameById, query, tickets, user?.id]);

    const stats = useMemo(() => ({
        total: tickets.length,
        mine: tickets.filter((ticket) => Boolean(user?.id) && ticket.assignee_ids.includes(String(user.id))).length,
        unassigned: tickets.filter((ticket) => ticket.assignee_ids.length === 0).length,
        overdue: tickets.filter(isTicketOverdue).length,
    }), [tickets, user?.id]);

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Tickets</>}
                    title="Client requests and support work in one operational inbox"
                    description="This MVP inbox is powered by the current project and task system so the team can start handling incoming work now while the dedicated ticket domain is being built."
                    right={
                        <DashboardSurface className="flex flex-wrap gap-3 border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                            <DashboardBadge tone="blue">{stats.total} total</DashboardBadge>
                            <DashboardBadge tone="emerald">{stats.mine} mine</DashboardBadge>
                            <DashboardBadge tone="amber">{stats.unassigned} unassigned</DashboardBadge>
                            <DashboardBadge tone="red">{stats.overdue} overdue</DashboardBadge>
                        </DashboardSurface>
                    }
                />

                <DashboardToolbar className="gap-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            className="h-11 rounded-2xl border-slate-200 bg-white pl-11"
                            placeholder="Search by ticket ID, title, requester, project, assignee, or tag"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {([
                            { key: "all", label: "All" },
                            { key: "mine", label: "My Tickets" },
                            { key: "unassigned", label: "Unassigned" },
                            { key: "overdue", label: "Overdue" },
                        ] as const).map((item) => (
                            <Button
                                key={item.key}
                                variant={filter === item.key ? "default" : "outline"}
                                onClick={() => setFilter(item.key)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </DashboardToolbar>

                {isLoading ? (
                    <DashboardSurface className="text-sm text-slate-600">Loading ticket inbox...</DashboardSurface>
                ) : error ? (
                    <DashboardNotice tone="red">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <h3 className="font-semibold">We couldn&apos;t load tickets</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                    </DashboardNotice>
                ) : filteredTickets.length === 0 ? (
                    <DashboardSurface>
                        <DashboardEmpty
                            title="No tickets match this view yet"
                            description="As public intake and support work starts flowing through projects, tickets will appear here for search, triage, and follow-up."
                        />
                    </DashboardSurface>
                ) : (
                    <DashboardSurface className="overflow-hidden p-0">
                        <DashboardSectionHeading
                            title="Ticket Inbox"
                            description="Click a ticket to open the working detail view built on top of the current task record."
                            action={<Button onClick={() => router.push("/dashboard/tickets/create")}>Create Ticket</Button>}
                        />
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50/80">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        <th className="px-5 py-3">Ticket</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Priority</th>
                                        <th className="px-5 py-3">Project</th>
                                        <th className="px-5 py-3">Requester</th>
                                        <th className="px-5 py-3">Assignees</th>
                                        <th className="px-5 py-3">Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white/80">
                                    {filteredTickets.map((ticket) => {
                                        const assigneeLabel = formatMemberList(memberNameById, ticket.assignee_ids, "Unassigned");
                                        return (
                                            <tr
                                                key={ticket.id}
                                                className="cursor-pointer transition-colors hover:bg-slate-50"
                                                onClick={() => router.push(`/dashboard/tickets/${encodeURIComponent(ticket.id)}?projectId=${encodeURIComponent(ticket.project_id)}&projectName=${encodeURIComponent(ticket.project_name)}&ticketNumber=${encodeURIComponent(ticket.ticket_number)}`)}
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{ticket.ticket_number}</div>
                                                        <div className="font-medium text-slate-950">{ticket.title}</div>
                                                        {ticket.description ? (
                                                            <p className="max-w-xl truncate text-sm text-slate-500">{ticket.description}</p>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4"><DashboardBadge tone={ticketStatusTone(ticket.status)}>{ticket.status}</DashboardBadge></td>
                                                <td className="px-5 py-4"><DashboardBadge tone={ticketPriorityTone(ticket.priority)}>{ticket.priority}</DashboardBadge></td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{ticket.project_name}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{ticket.requester_name}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{assigneeLabel}</td>
                                                <td className="px-5 py-4">
                                                    <div className="text-sm text-slate-600">{formatTicketDate(ticket.due_date)}</div>
                                                    {isTicketOverdue(ticket) ? <div className="text-xs font-semibold text-red-600">Overdue</div> : null}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </DashboardSurface>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    <DashboardSurface className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Ticket className="h-5 w-5 text-emerald-600" />
                            <h3 className="font-semibold text-slate-950">What this MVP does</h3>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                            It gives the team one operational inbox for support work today by aggregating project tasks into a ticket-shaped view.
                        </p>
                    </DashboardSurface>
                    <DashboardSurface className="space-y-3">
                        <div className="flex items-center gap-3">
                            <UserRound className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-slate-950">Current requester model</h3>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                            Requester names are inferred from the current task owner until the dedicated ticket domain introduces explicit requester and client records.
                        </p>
                    </DashboardSurface>
                    <DashboardSurface className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Clock3 className="h-5 w-5 text-amber-600" />
                            <h3 className="font-semibold text-slate-950">Next step</h3>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                            The next implementation slice will add richer detail actions and separate ticket semantics from delivery task semantics.
                        </p>
                    </DashboardSurface>
                </div>
            </DashboardContent>
        </DashboardCanvas>
    );
}

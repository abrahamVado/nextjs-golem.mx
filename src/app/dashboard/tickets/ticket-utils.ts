import { TeamMember, TicketListItem, TicketStatus } from "@/types";

export function inferTicketStatus(columnKey?: string): TicketStatus {
    const normalized = (columnKey || "").trim().toLowerCase();
    switch (normalized) {
        case "todo":
        case "backlog":
            return "New";
        case "in_progress":
        case "in-progress":
        case "in_review":
        case "in-review":
            return "Open";
        case "done":
            return "Resolved";
        case "archived":
            return "Closed";
        default:
            return "Open";
    }
}

export function ticketStatusTone(status: TicketStatus): "blue" | "emerald" | "amber" | "red" | "slate" {
    switch (status) {
        case "Resolved":
        case "Closed":
            return "emerald";
        case "Pending":
            return "amber";
        case "Cancelled":
            return "slate";
        default:
            return "blue";
    }
}

export function ticketPriorityTone(priority: string): "blue" | "emerald" | "amber" | "red" | "slate" {
    switch (priority) {
        case "URGENT":
            return "red";
        case "HIGH":
            return "amber";
        case "LOW":
            return "slate";
        default:
            return "blue";
    }
}

export function formatTicketDate(value?: string, fallback = "No date"): string {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isTicketOverdue(ticket: TicketListItem): boolean {
    if (!ticket.due_date) return false;
    const target = new Date(ticket.due_date);
    if (Number.isNaN(target.getTime())) return false;
    const normalizedToday = new Date();
    normalizedToday.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return target.getTime() < normalizedToday.getTime() && !["Resolved", "Closed", "Cancelled"].includes(ticket.status);
}

export function memberMapFromList(members: TeamMember[]): Map<string, string> {
    const map = new Map<string, string>();
    members.forEach((member) => map.set(String(member.user_id), member.name || member.email));
    return map;
}

export function formatMemberName(memberMap: Map<string, string>, userId?: string | null, fallback = "Unknown user"): string {
    if (!userId) return fallback;
    return memberMap.get(String(userId)) || `User ${String(userId).slice(0, 8)}`;
}

export function formatMemberList(memberMap: Map<string, string>, ids?: string[], fallback = "None"): string {
    if (!ids || ids.length === 0) return fallback;
    return ids.map((id) => formatMemberName(memberMap, id)).join(", ");
}

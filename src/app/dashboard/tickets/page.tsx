import PageTitle from "@/components/layout/PageTitle";

export default function TicketsPage() {
    return (
        <div className="p-6 space-y-4">
            <PageTitle
                title="Tickets"
                description="Track and manage support tickets and issue workflows."
            />
            <p className="text-gray-500">Ticket functionality is currently unavailable.</p>
        </div>
    );
}

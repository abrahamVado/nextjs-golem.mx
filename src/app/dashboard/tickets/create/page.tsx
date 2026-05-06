import PageTitle from "@/components/layout/PageTitle";

export default function CreateTicketPage() {
    return (
        <div className="p-6 space-y-4">
            <PageTitle
                title="Create Ticket"
                description="Create new support tickets and assign ownership."
            />
            <p className="text-gray-500">Ticket creation is currently unavailable.</p>
        </div>
    );
}

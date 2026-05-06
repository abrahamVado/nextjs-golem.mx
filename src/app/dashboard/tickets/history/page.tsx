"use client";

import React from 'react';
import '../tickets.css';
import PageTitle from '@/components/layout/PageTitle';
import { History } from 'lucide-react';

export default function TicketsHistoryPage() {
    return (
        <div className="tickets-wrapper">
            <PageTitle
                title="Ticket History"
                description="Review historical ticket changes and prior activity."
                className="mb-4"
            />
            <div className="custom-dashboard-card bg-card text-card-foreground">
                <div className="p-6 text-center text-muted-foreground">
                    <History className="mx-auto mb-4 h-10 w-10" />
                    <h2 className="text-xl font-semibold mb-2">History</h2>
                    <p>Ticket history has been moved to the main Tickets page.</p>
                </div>
            </div>
        </div>
    );
}

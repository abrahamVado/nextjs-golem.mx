"use client";

import React from 'react';
import '../tickets.css';
import PageTitle from '@/components/layout/PageTitle';
import { Settings } from 'lucide-react';

export default function TicketSettingsPage() {
    return (
        <div className="tickets-wrapper">
            <PageTitle
                title="Ticket Settings"
                description="Configure ticket-related defaults and workflow preferences."
                className="mb-4"
            />
            <div className="custom-dashboard-card bg-card text-card-foreground">
                <div className="p-6 text-center text-muted-foreground">
                    <Settings className="mx-auto mb-4 h-10 w-10" />
                    <h2 className="text-xl font-semibold mb-2">Settings</h2>
                    <p>Ticket settings have been moved to the main Tickets page.</p>
                </div>
            </div>
        </div>
    );
}

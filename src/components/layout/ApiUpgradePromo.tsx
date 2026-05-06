"use client";

import { Button } from "@/components/ui/Button";

export default function ApiUpgradePromo() {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Power User API Access</h3>
                <p className="text-sm text-muted-foreground">
                    API credentials can be created only by <span className="font-medium text-foreground">Root</span> and{" "}
                    <span className="font-medium text-foreground">Admin</span> users.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>- Create and rotate API keys</li>
                    <li>- Configure public keys for request signing</li>
                    <li>- Access orchestration endpoints securely</li>
                </ul>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Upgrade</p>
                <h3 className="text-xl font-semibold text-foreground">Become a Power User</h3>
                <p className="text-sm text-muted-foreground">
                    Unlock API tooling and automation features by upgrading your role.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button>Upgrade Plan</Button>
                    <Button variant="outline">Request Access</Button>
                </div>
            </div>
        </div>
    );
}

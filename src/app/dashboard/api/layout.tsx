'use client';

export default function APILayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="dashboard-shell">
            {children}
        </div>
    );
}

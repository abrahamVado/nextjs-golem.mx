'use client';

export default function AccessLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="dashboard-shell">
            {children}
        </div>
    );
}

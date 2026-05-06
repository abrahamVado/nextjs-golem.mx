import React from 'react';
import Link from 'next/link';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0 flex items-center">
                            {/* Logo / Brand */}
                            <Link href="/public/careers" className="text-xl font-bold tracking-tight">
                                Careers
                            </Link>
                        </div>
                        {/* Optional Nav */}
                    </div>
                </div>
            </header>

            <main>
                {children}
            </main>

            <footer className="bg-white border-t mt-12">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} Company Name. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

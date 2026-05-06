'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        await api.get('/me');
        setAuthorized(true);
      } catch {
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    void checkAdminAccess();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Users
            </Link>
            <Link
              href="/admin/teams"
              className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Teams
            </Link>
            <Link
              href="/admin/health"
              className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              System Health
            </Link>
            <Link
              href="/dashboard/access"
              className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Access Control
            </Link>
            <Link
              href="/dashboard/api/clients"
              className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              API Administration
            </Link>
            <Link
              href="/dashboard/api/orchestration"
              className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              API Orchestration
            </Link>
          </div>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700">
           <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
             &larr; Back to App
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}

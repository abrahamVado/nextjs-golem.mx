"use client";

import React, { useEffect, useState } from 'react';
import PageRenderer from '@/components/modules/PageRenderer';
import { moduleLoader } from '@/modules/loader';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const [hasPublicSite, setHasPublicSite] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the specific view is registered
    moduleLoader.init().then(() => {
      const view = moduleLoader.getView("public-site.landing");
      setHasPublicSite(!!view);
    });
  }, []);

  if (hasPublicSite === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (hasPublicSite) {
    return <PageRenderer viewKey="public-site.landing" />;
  }

  // Fallback: Default SPA Entry (e.g. redirect to login or simple welcome)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Larago App</h1>
        <p className="text-gray-600 mb-8">The modular full-stack application.</p>
        <Link href="/login">
          <Button size="lg">Log In to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

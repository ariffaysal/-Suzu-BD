'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

/** Redirects to /admin/login unless a valid admin session exists. */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { admin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.replace('/admin/login');
    }
  }, [isLoading, admin, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
        Checking session…
      </div>
    );
  }

  if (!admin) {
    return null; // redirecting
  }

  return <>{children}</>;
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function AdminPage() {
  const router = useRouter();
  const { admin, isLoading, logout } = useAuth();

  // Not signed in (or session still restoring) — take them to the login page.
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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Admin Panel</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Welcome{admin.name ? `, ${admin.name}` : ''} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-700">{admin.email}</span>
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-3xl">📦</p>
        <h2 className="mt-3 text-lg font-semibold text-gray-900">Admin area — coming soon</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Your login is working. The admin dashboard (orders, products, hero slides and more) will
          be added here next.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import ProductsManager from '@/components/admin/ProductsManager';
import CategoriesManager from '@/components/admin/CategoriesManager';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

type Tab = 'products' | 'categories';

export default function AdminPage() {
  const { admin, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('products');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'products', label: 'Products' },
    { key: 'categories', label: 'Categories' },
  ];

  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Admin Panel
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Welcome{admin?.name ? `, ${admin.name}` : ''} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage products, prices, images and categories — changes save straight to the
              database.
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                tab === t.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'products' ? <ProductsManager /> : <CategoriesManager />}
        </div>
      </div>
    </AdminGuard>
  );
}

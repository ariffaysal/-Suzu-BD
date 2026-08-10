'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import ProductForm from '@/components/admin/ProductForm';
import type { Product } from '@/types';
import { adminGetProduct } from '@/services/admin';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetProduct(id)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update details, prices, images or stock — changes save to the database.
        </p>

        {loading ? (
          <p className="mt-10 text-center text-sm text-gray-500">Loading product…</p>
        ) : error ? (
          <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
            {error}
          </p>
        ) : product ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
            <ProductForm product={product} />
          </div>
        ) : null}
      </div>
    </AdminGuard>
  );
}

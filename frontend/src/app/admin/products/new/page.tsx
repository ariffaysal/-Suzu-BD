'use client';

import AdminGuard from '@/components/admin/AdminGuard';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900">Add product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a product in any category with images, sizes and stock.
        </p>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <ProductForm />
        </div>
      </div>
    </AdminGuard>
  );
}

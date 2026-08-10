'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import { assetUrl } from '@/services/api';
import { formatPrice } from '@/services/format';
import { adminGetProducts, deleteProduct } from '@/services/admin';

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await adminGetProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q) ||
        p.category?.slug.toLowerCase().includes(q),
    );
  }, [products, search]);

  async function handleDelete(product: Product) {
    if (
      !window.confirm(
        `Delete "${product.title}"? This removes the product and its variants/images permanently.`,
      )
    ) {
      return;
    }
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-500">Loading products…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {products.length} product{products.length === 1 ? '' : 's'} — edit prices, upload
            images or remove items.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          + Add product
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or category…"
        className="mt-4 w-full max-w-sm rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {search ? 'No products match your search.' : 'No products yet — add your first one.'}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => {
                const image = assetUrl(product.images[0]?.url);
                const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {image ? (
                            <Image
                              src={image}
                              alt={product.title}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{product.title}</p>
                          <p className="truncate text-xs text-gray-400 md:hidden">
                            {product.category?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(product.discountPrice ?? product.regularPrice)}
                      </p>
                      {product.discountPrice != null && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(product.regularPrice)}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={
                          stock > 0
                            ? 'font-medium text-green-700'
                            : 'font-medium text-red-600'
                        }
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

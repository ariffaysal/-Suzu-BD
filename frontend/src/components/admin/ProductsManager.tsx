'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import { assetUrl } from '@/services/api';
import { formatPrice } from '@/services/format';
import { adminGetProducts, deleteProduct } from '@/services/admin';

function totalStock(p: Product): number {
  return p.variants.reduce((sum, v) => sum + v.stock, 0);
}

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
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

  const lowCount = useMemo(
    () => products.filter((p) => totalStock(p) > 0 && totalStock(p) < 5).length,
    [products],
  );
  const outCount = useMemo(
    () => products.filter((p) => totalStock(p) === 0).length,
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products;
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.category?.slug.toLowerCase().includes(q),
      );
    }
    if (stockFilter === 'low') {
      list = list.filter((p) => totalStock(p) > 0 && totalStock(p) < 5);
    } else if (stockFilter === 'out') {
      list = list.filter((p) => totalStock(p) === 0);
    }
    return list;
  }, [products, search, stockFilter]);

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

      {(lowCount > 0 || outCount > 0) && (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <span aria-hidden>⚠</span>
          <span>
            {outCount > 0 && `${outCount} out of stock`}
            {outCount > 0 && lowCount > 0 && ' · '}
            {lowCount > 0 && `${lowCount} low on stock`}
            {' — restock to keep them available.'}
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or category…"
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <div className="flex items-center gap-1.5">
          {(
            [
              ['all', 'All'],
              ['low', `Low stock (<5)`],
              ['out', 'Out of stock'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStockFilter(value)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                stockFilter === value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {search
            ? 'No products match your search.'
            : stockFilter !== 'all'
              ? 'No products match this stock filter.'
              : 'No products yet — add your first one.'}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => {
                const image = assetUrl(product.images[0]?.url);
                const stock = totalStock(product);
                const low = stock > 0 && stock < 5;
                const out = stock === 0;
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            low || out ? 'text-red-600' : 'text-green-700'
                          }`}
                        >
                          {stock}
                        </span>
                        {out ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Out of stock
                          </span>
                        ) : low ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Low stock
                          </span>
                        ) : null}
                      </div>
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

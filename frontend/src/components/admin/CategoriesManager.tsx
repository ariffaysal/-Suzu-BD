'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Category, Collection } from '@/types';
import { categoryIcon } from '@/services/categories';
import { adminGetCategories, createCategory, deleteCategory } from '@/services/admin';

const COLLECTIONS: { value: Collection; label: string }[] = [
  { value: 'MEN', label: 'Men Collection' },
  { value: 'WOMEN', label: 'Women Collection' },
  { value: 'ACCESSORIES', label: 'Accessories' },
];

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [collection, setCollection] = useState<Collection>('MEN');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await adminGetCategories());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    return COLLECTIONS.map((c) => ({
      ...c,
      items: categories.filter((cat) => cat.collection === c.value),
    }));
  }, [categories]);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createCategory({
        name: name.trim(),
        collection,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      });
      setCategories((prev) => [...prev, created]);
      setName('');
      setSlug('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (
      !window.confirm(
        `Delete category "${category.name}"? Only empty categories can be removed.`,
      )
    ) {
      return;
    }
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-500">Loading categories…</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Categories</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Add new segments or remove empty ones. Categories with products can&apos;t be deleted
          until their products are moved or removed.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name (e.g. Sandals)"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value as Collection)}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          {COLLECTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (optional, e.g. men-sandals)"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Adding…' : '+ Add category'}
        </button>
      </form>

      {/* Grouped list */}
      <div className="mt-6 space-y-6">
        {grouped.map((group) => (
          <div key={group.value}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              {group.label}
            </h3>
            {group.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm text-gray-400">
                No categories yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">Slug</th>
                      <th className="px-4 py-3 font-semibold">Products</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.items.map((category) => {
                      const count = category._count?.products ?? 0;
                      return (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span aria-hidden className="text-lg">
                                {categoryIcon(category.slug)}
                              </span>
                              <span className="font-semibold text-gray-900">{category.name}</span>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                            {category.slug}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                count > 0 ? 'font-medium text-gray-700' : 'text-gray-400'
                              }
                            >
                              {count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDelete(category)}
                              disabled={count > 0}
                              title={
                                count > 0
                                  ? `Move or delete its ${count} product(s) first`
                                  : 'Delete category'
                              }
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

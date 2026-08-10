'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Category, Collection, Product } from '@/types';
import { assetUrl } from '@/services/api';
import { adminGetCategories, createProduct, updateProduct, uploadImage } from '@/services/admin';

interface VariantRow {
  size: string;
  color: string;
  stock: string;
}

const COLLECTION_LABELS: Record<Collection, string> = {
  MEN: 'Men Collection',
  WOMEN: 'Women Collection',
  ACCESSORIES: 'Accessories',
};

export default function ProductForm({ product }: { product?: Product | null }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(product?.title ?? '');
  const [categoryId, setCategoryId] = useState(product ? String(product.categoryId) : '');
  const [regularPrice, setRegularPrice] = useState(
    product ? String(product.regularPrice) : '',
  );
  const [discountPrice, setDiscountPrice] = useState(
    product?.discountPrice != null ? String(product.discountPrice) : '',
  );
  const [description, setDescription] = useState(product?.description ?? '');
  const [images, setImages] = useState<string[]>(product?.images.map((i) => i.url) ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({
      size: v.size,
      color: v.color ?? '',
      stock: String(v.stock),
    })) ?? [],
  );
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetCategories()
      .then((cats) => {
        setCategories(cats);
        // Default to the product's own category (or the first one)
        if (!categoryId && cats.length > 0) {
          setCategoryId(String(cats[0].id));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadImage(file);
      setImages((prev) => [...prev, res.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function addImageByUrl() {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/)/.test(url)) {
      setError('Image URL must start with http(s):// or /');
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlInput('');
    setError(null);
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, { size: '', color: '', stock: '' }]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        regularPrice: Number(regularPrice),
        discountPrice: discountPrice.trim() === '' ? null : Number(discountPrice),
        categoryId: Number(categoryId),
        images: images.map((url) => ({ url })),
        variants: variants
          .filter((v) => v.size.trim() !== '')
          .map((v) => ({
            size: v.size.trim(),
            color: v.color.trim() || undefined,
            stock: v.stock.trim() === '' ? 0 : Number(v.stock),
          })),
      };
      if (editing && product) {
        await updateProduct(product.id, input);
      } else {
        await createProduct(input);
      }
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Product title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AirFlex Runner Sneakers"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Category *</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="" disabled>
                Select a category…
              </option>
              {(['MEN', 'WOMEN', 'ACCESSORIES'] as Collection[]).map((collection) => (
                <optgroup key={collection} label={COLLECTION_LABELS[collection]}>
                  {categories
                    .filter((c) => c.collection === collection)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Regular price (BDT) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="89.99"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Discount price (BDT)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Leave empty for none"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product…"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Product images (upload from your device)
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm font-semibold text-gray-600 transition-colors hover:border-indigo-400 hover:text-indigo-600">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploading ? 'Uploading…' : '⬆ Upload image (max 5MB)'}
            </label>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImageByUrl();
                  }
                }}
                placeholder="…or paste an image URL"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="button"
                onClick={addImageByUrl}
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Add
              </button>
            </div>

            {images.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                  >
                    <Image src={assetUrl(url) ?? ''} alt="" fill sizes="120px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white transition-colors hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-400">
                No images yet. The first image shows in the store.
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Sizes / variants</label>
              <button
                type="button"
                onClick={addVariantRow}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                + Add size
              </button>
            </div>
            <div className="space-y-2">
              {variants.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-400">
                  No sizes yet — add a size, color and stock for each variant.
                </p>
              )}
              {variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((v, i) => (i === index ? { ...v, size: e.target.value } : v)),
                      )
                    }
                    placeholder="Size (e.g. 42)"
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <input
                    type="text"
                    value={variant.color}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((v, i) => (i === index ? { ...v, color: e.target.value } : v)),
                      )
                    }
                    placeholder="Color (e.g. White)"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((v, i) => (i === index ? { ...v, stock: e.target.value } : v)),
                      )
                    }
                    placeholder="Stock"
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Remove variant"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-gray-200 pt-5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

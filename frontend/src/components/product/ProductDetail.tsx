'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { assetUrl } from '@/services/api';
import { discountPercent, formatPrice } from '@/services/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showToast } = useUI();

  const images = product.images.map((img) => assetUrl(img.url)).filter(Boolean) as string[];
  const [activeImage, setActiveImage] = useState(images[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color).filter((c): c is string => !!c))],
    [product.variants],
  );

  const sizes = useMemo(() => {
    const available = product.variants
      .filter((v) => !selectedColor || v.color === selectedColor)
      .map((v) => v.size);
    return [...new Set(available)].sort((a, b) => Number(a) - Number(b));
  }, [product.variants, selectedColor]);

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (v) => v.size === selectedSize && (!selectedColor || v.color === selectedColor),
      ),
    [product.variants, selectedSize, selectedColor],
  );

  const discount = discountPercent(product.regularPrice, product.discountPrice);

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please select a size first');
      return;
    }
    addItem(product, selectedSize, quantity, selectedColor);
    showToast('Added to cart 🛒');
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {activeImage ? (
            <Image src={activeImage} alt={product.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">No image</div>
          )}
          {discount ? (
            <Badge className="absolute left-4 top-4">-{discount}%</Badge>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="mt-4 flex gap-3">
            {images.map((image) => (
              <button
                key={image}
                onClick={() => setActiveImage(image)}
                className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                  activeImage === image ? 'border-indigo-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image src={image} alt={product.title} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div>
        {product.category ? (
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            {product.category.name}
          </Link>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{product.title}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.discountPrice ?? product.regularPrice)}
          </span>
          {product.discountPrice ? (
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(product.regularPrice)}
            </span>
          ) : null}
        </div>

        {product.description ? (
          <p className="mt-4 leading-relaxed text-gray-600">{product.description}</p>
        ) : null}

        {/* Color selector */}
        {colors.length > 1 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-gray-900">
              Color: <span className="font-normal text-gray-600">{selectedColor ?? 'Select'}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setSelectedSize(null);
                  }}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedColor === color
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300 text-gray-800 hover:border-gray-400'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Size selector */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-900">
            Size: <span className="font-normal text-gray-600">{selectedSize ?? 'Select'}</span>
          </p>
          {sizes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((size) => {
                const variant = product.variants.find(
                  (v) => v.size === size && (!selectedColor || v.color === selectedColor),
                );
                const outOfStock = !variant || variant.stock <= 0;
                return (
                  <button
                    key={size}
                    disabled={outOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 min-w-11 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      selectedSize === size
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 text-gray-800 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-red-600">Out of stock</p>
          )}
        </div>

        {selectedVariant && (
          <p className="mt-3 text-sm text-gray-500">
            {selectedVariant.stock > 0
              ? `${selectedVariant.stock} in stock`
              : 'This size is currently out of stock'}
          </p>
        )}

        {/* Quantity + Add to cart */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-lg border border-gray-300">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <Button onClick={handleAddToCart} className="flex-1 sm:flex-none sm:px-8">
            Add to Cart
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Delivery &amp; Payment</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Cash on Delivery available nationwide</li>
            <li>Free shipping on orders over $100</li>
            <li>7-day easy returns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

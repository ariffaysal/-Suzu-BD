'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { assetUrl } from '@/services/api';
import { formatPrice } from '@/services/format';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalItems, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
        <p className="text-3xl">🛒</p>
        <p className="mt-3 text-lg font-semibold text-gray-900">Your cart is empty</p>
        <p className="mt-1 text-sm text-gray-500">
          Browse the collection and add something you love.
        </p>
        <Link href="/products">
          <Button className="mt-6">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Shopping Cart{' '}
        <span className="text-base font-normal text-gray-500">({totalItems} items)</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const image = assetUrl(item.product.images[0]?.url);
            const unitPrice = item.product.discountPrice ?? item.product.regularPrice;
            return (
              <div
                key={`${item.product.id}-${item.size}`}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {image ? (
                    <Image src={image} alt={item.product.title} fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">—</div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {item.product.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Size {item.size}
                        {item.color ? ` · ${item.color}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.size)}
                      className="text-sm text-gray-400 hover:text-red-600"
                      aria-label={`Remove ${item.product.title}`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.quantity - 1)
                        }
                        className="px-3 py-1 text-gray-600 hover:text-gray-900"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.quantity + 1)
                        }
                        className="px-3 py-1 text-gray-600 hover:text-gray-900"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(unitPrice * item.quantity)}</p>
                      {item.product.discountPrice ? (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(item.product.regularPrice * item.quantity)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-semibold text-gray-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Shipping</dt>
              <dd className="font-semibold text-green-600">Free</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
              <dt className="font-bold text-gray-900">Total</dt>
              <dd className="font-bold text-gray-900">{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-xs text-green-700">
            💵 Cash on Delivery — pay when your order arrives at your door.
          </p>
          <Link href="/checkout" className="mt-4 block">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm font-medium text-indigo-600 hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

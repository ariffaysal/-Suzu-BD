'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { createOrder } from '@/services/orders';
import { formatPrice } from '@/services/format';
import Button from '@/components/ui/Button';

interface CheckoutSuccess {
  id: number;
  totalAmount: number;
  customerName: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useUI();

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CheckoutSuccess | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        paymentMethod: 'COD',
        items: items.map((item) => ({
          productId: item.product.id,
          size: item.size,
          quantity: item.quantity,
        })),
      });
      clearCart();
      setSuccess({
        id: order.id,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      showToast('Order could not be placed');
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-5xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Order Placed!</h1>
        <p className="mt-2 text-gray-600">
          Thank you, <span className="font-semibold">{success.customerName}</span>. Your order
          <span className="font-semibold"> #{success.id}</span> for{' '}
          <span className="font-semibold">{formatPrice(success.totalAmount)}</span> has been
          received.
        </p>
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          💵 Pay <span className="font-semibold">{formatPrice(success.totalAmount)}</span> in cash
          when your order arrives. We will call you shortly to confirm delivery.
        </p>
        <Link href="/products">
          <Button className="mt-6">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
        <p className="text-3xl">🛒</p>
        <p className="mt-3 text-lg font-semibold text-gray-900">Your cart is empty</p>
        <p className="mt-1 text-sm text-gray-500">Add items to your cart before checking out.</p>
        <Link href="/products">
          <Button className="mt-6">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Delivery Information</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="customerName" className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="customerName"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 01XXXXXXXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                  Delivery Address *
                </label>
                <textarea
                  id="address"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="House, road, area, city…"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-300 bg-indigo-50 p-4">
              <input type="radio" name="payment" checked readOnly className="mt-1 accent-indigo-600" />
              <span>
                <span className="block text-sm font-semibold text-gray-900">Cash on Delivery (COD)</span>
                <span className="block text-sm text-gray-500">
                  Pay in cash when your order is delivered to your door.
                </span>
              </span>
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={submitting} className="w-full py-3">
            {submitting ? 'Placing Order…' : `Place Order · ${formatPrice(subtotal)}`}
          </Button>
          <p className="text-center text-xs text-gray-400">
            By placing this order you agree to our terms and conditions.
          </p>
        </form>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => {
              const unitPrice = item.product.discountPrice ?? item.product.regularPrice;
              return (
                <li key={`${item.product.id}-${item.size}`} className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-600">
                    {item.product.title} <span className="text-gray-400">× {item.quantity}</span>
                    <span className="block text-xs text-gray-400">Size {item.size}</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(unitPrice * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-3 text-base">
            <span className="font-bold text-gray-900">Total (COD)</span>
            <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/cart"
            className="mt-4 block text-center text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}

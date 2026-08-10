'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Order } from '@/types';
import { formatPrice } from '@/services/format';
import {
  adminGetProducts,
  deleteOrder,
  getOrders,
  updateOrderStatus,
} from '@/services/admin';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PERIODS = [
  { key: '1d', label: '1 Day', days: 1 },
  { key: '7d', label: '7 Days', days: 7 },
  { key: '30d', label: '30 Days', days: 30 },
  { key: 'all', label: 'All Time', days: null },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [productTitles, setProductTitles] = useState<Map<number, string>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await getOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Map product ids → titles so order items show real product names.
    adminGetProducts()
      .then((products) => setProductTitles(new Map(products.map((p) => [p.id, p.title]))))
      .catch(() => {});
  }, [load]);

  const summary = useMemo(() => {
    const now = Date.now();
    return PERIODS.map((period) => {
      const cutoff = period.days === null ? 0 : now - period.days * 24 * 60 * 60 * 1000;
      const inPeriod = orders.filter(
        (order) => new Date(order.createdAt).getTime() >= cutoff,
      );
      return {
        ...period,
        count: inPeriod.length,
        total: inPeriod.reduce((sum, order) => sum + order.totalAmount, 0),
      };
    });
  }, [orders]);

  async function handleStatusChange(order: Order, status: string) {
    setError(null);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function handleDelete(order: Order) {
    if (
      !window.confirm(
        `Delete order #${order.id} from ${order.customerName} (${formatPrice(order.totalAmount)})? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (expandedId === order.id) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-500">Loading orders…</p>;
  }

  return (
    <div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Orders</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Customer orders with full details — track, update status or delete.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* Order summary */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((period) => (
          <div
            key={period.key}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {period.label}
            </p>
            <p className="mt-2 text-2xl font-black text-gray-900">{period.count}</p>
            <p className="text-xs text-gray-500">orders</p>
            <p className="mt-2 truncate text-sm font-bold text-indigo-600">
              {formatPrice(period.total)}
            </p>
            <p className="text-xs text-gray-500">total sales</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      {orders.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No orders yet — customer checkouts will appear here.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const expanded = expandedId === order.id;
                return (
                  <OrderRow
                    key={order.id}
                    order={order}
                    itemCount={itemCount}
                    expanded={expanded}
                    productTitles={productTitles}
                    onToggle={() => setExpandedId(expanded ? null : order.id)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface OrderRowProps {
  order: Order;
  itemCount: number;
  expanded: boolean;
  productTitles: Map<number, string>;
  onToggle: () => void;
  onStatusChange: (order: Order, status: string) => void;
  onDelete: (order: Order) => void;
}

function OrderRow({
  order,
  itemCount,
  expanded,
  productTitles,
  onToggle,
  onStatusChange,
  onDelete,
}: OrderRowProps) {
  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">#{order.id}</span>
            <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="mt-1 text-xs font-semibold text-indigo-600 hover:underline"
          >
            {expanded ? 'Hide details ▲' : 'View details ▼'}
          </button>
        </td>
        <td className="hidden px-4 py-3 md:table-cell">
          <p className="font-semibold text-gray-900">{order.customerName}</p>
          <p className="text-xs text-gray-500">{order.phone}</p>
          <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500">{order.address}</p>
        </td>
        <td className="px-4 py-3 text-gray-700">
          {itemCount} item{itemCount === 1 ? '' : 's'}
        </td>
        <td className="px-4 py-3">
          <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
            {order.paymentMethod}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {order.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order, e.target.value)}
              aria-label={`Status for order ${order.id}`}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onDelete(order)}
              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
              {/* Customer */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Customer
                </p>
                <p className="mt-1 font-semibold text-gray-900">{order.customerName}</p>
                <p className="text-sm text-gray-600">📞 {order.phone}</p>
                <p className="text-sm text-gray-600">📍 {order.address}</p>
                <p className="mt-1 text-sm text-gray-600">
                  💳 {order.paymentMethod} · placed {formatDate(order.createdAt)}
                </p>
              </div>
              {/* Items */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Items
                </p>
                <ul className="mt-1 space-y-1.5">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-gray-900">
                          {productTitles.get(item.productId) ?? `Product #${item.productId}`}
                        </span>
                        <span className="text-gray-500">
                          {' '}
                          · Size {item.size} · ×{item.quantity}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 border-t border-gray-200 pt-2 text-right text-sm font-bold text-gray-900">
                  Total: {formatPrice(order.totalAmount)}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

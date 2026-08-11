'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import type { Order, OrderStatsPeriod } from '@/types';
import { formatPrice } from '@/services/format';
import { assetUrl } from '@/services/api';
import {
  adminGetProducts,
  deleteOrder,
  getOrderStats,
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
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [productInfo, setProductInfo] = useState<
    Map<number, { title: string; image: string | null }>
  >(new Map());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // Dashboard stats come from the server (GET /orders/stats); zeros until loaded.
  const [stats, setStats] = useState<OrderStatsPeriod[]>(() =>
    PERIODS.map((p) => ({ key: p.key, count: 0, total: 0 })),
  );

  // Called on mount and when paging; `loading`/`error` already hold their
  // initial values. All setStates run in promise callbacks (never synchronously
  // in the effect).
  const load = useCallback((pageNumber: number) => {
    return getOrders({ page: pageNumber })
      .then((result) => {
        setOrders(result.items);
        setPage(result.page);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load(1);
    // Map product ids → title + first image so order items show real names and
    // pictures (loads the full catalog at the server's max page size).
    adminGetProducts({ limit: 500 })
      .then((result) =>
        setProductInfo(
          new Map(
            result.items.map((p) => [
              p.id,
              { title: p.title, image: p.images[0]?.url ?? null },
            ]),
          ),
        ),
      )
      .catch(() => {});
    getOrderStats()
      .then(setStats)
      .catch(() => {});
  }, [load]);

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

      {/* Order summary — server-computed so it covers all orders, not just the current page */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((period) => (
          <div
            key={period.key}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {PERIODS.find((p) => p.key === period.key)?.label ?? period.key}
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

      {/* Large order detail popup */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          productInfo={productInfo}
          onClose={() => setDetailOrder(null)}
        />
      )}

      {/* Orders table */}
      {total === 0 ? (
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
                    productInfo={productInfo}
                    onToggle={() => setExpandedId(expanded ? null : order.id)}
                    onView={() => setDetailOrder(order)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500">
                {total} {total === 1 ? 'order' : 'orders'} · Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void load(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => void load(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface OrderRowProps {
  order: Order;
  itemCount: number;
  expanded: boolean;
  productInfo: Map<number, { title: string; image: string | null }>;
  onToggle: () => void;
  onView: () => void;
  onStatusChange: (order: Order, status: string) => void;
  onDelete: (order: Order) => void;
}

function OrderRow({
  order,
  itemCount,
  expanded,
  productInfo,
  onToggle,
  onView,
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
            <button
              type="button"
              onClick={onView}
              title="View full order details"
              aria-label={`View full details for order ${order.id}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-indigo-200 bg-indigo-50 text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
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
                          {productInfo.get(item.productId)?.title ?? `Product #${item.productId}`}
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

interface OrderDetailModalProps {
  order: Order;
  productInfo: Map<number, { title: string; image: string | null }>;
  onClose: () => void;
}

/** Large, high-readability popup with full order + customer + product details. */
function OrderDetailModal({ order, productInfo, onClose }: OrderDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.id} details`}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Order Details
            </p>
            <h2 className="mt-0.5 text-2xl font-black text-gray-900">Order #{order.id}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {order.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close order details"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-xl font-bold text-gray-600 transition-colors hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Customer */}
          <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
              Customer
            </p>
            <p className="mt-1 text-2xl font-black text-gray-900">{order.customerName}</p>
            <p className="mt-2 text-xl font-semibold text-gray-800">📞 {order.phone}</p>
            <p className="mt-1 text-lg text-gray-700">📍 {order.address}</p>
            <p className="mt-2 text-base text-gray-500">
              💳 {order.paymentMethod} · placed {formatDate(order.createdAt)}
            </p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Products
            </p>
            <ul className="mt-2 space-y-3">
              {order.items.map((item) => {
                const info = productInfo.get(item.productId);
                const image = assetUrl(info?.image ?? null);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {image ? (
                        <Image
                          src={image}
                          alt={info?.title ?? `Product ${item.productId}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-gray-400">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
                          Code #{item.productId}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          {info?.title ?? `Product #${item.productId}`}
                        </span>
                      </div>
                      <p className="mt-1 text-base text-gray-600">
                        Size {item.size} · Quantity {item.quantity} ·{' '}
                        <span className="font-semibold">{formatPrice(item.price)} each</span>
                      </p>
                    </div>
                    <p className="shrink-0 text-xl font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer / total */}
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-base font-semibold text-gray-600">
            {order.items.reduce((sum, i) => sum + i.quantity, 0)} item(s) · {order.paymentMethod}
          </p>
          <p className="text-2xl font-black text-gray-900">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>
    </div>
  );
}

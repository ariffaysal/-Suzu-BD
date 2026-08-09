'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import Logo from '@/components/brand/Logo';
import { getCategories } from '@/services/products';
import { categoryIcon, groupByCollection } from '@/services/categories';
import type { Category } from '@/types';

export default function Header() {
  const { totalItems } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const groups = groupByCollection(categories);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group">
          <Logo
            monogramClassName="h-9 w-9 transition-transform duration-300 group-hover:scale-110"
            wordmarkClassName="text-xl tracking-wide"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-700 lg:flex">
          <Link href="/" className="hover:text-indigo-600">
            Home
          </Link>
          <Link href="/products?category=new-arrivals" className="hover:text-indigo-600">
            New Arrivals
          </Link>
          <Link href="/products" className="hover:text-indigo-600">
            All Products
          </Link>

          {/* Categories dropdown */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className={`inline-flex items-center gap-1 transition-colors hover:text-indigo-600 ${
                menuOpen ? 'text-indigo-600' : ''
              }`}
            >
              Categories
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="menu-drop absolute left-1/2 top-full z-50 mt-3 w-[720px] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                {/* Collection panels */}
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {groups.map((group) => (
                    <div key={group.key} className="px-4 py-5">
                      <div className="mb-3 flex items-center justify-between gap-2 px-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          {group.label}
                        </p>
                        <Link
                          href={`/products?collection=${group.key.toLowerCase()}`}
                          onClick={() => setMenuOpen(false)}
                          className="text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                        >
                          View all →
                        </Link>
                      </div>
                      <ul className="space-y-0.5">
                        {group.categories.map((category) => (
                          <li key={category.id}>
                            <Link
                              href={`/products?collection=${group.key.toLowerCase()}&category=${category.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                            >
                              <span aria-hidden className="w-5 text-center text-base leading-none">
                                {categoryIcon(category.slug)}
                              </span>
                              <span className="truncate">{category.name}</span>
                              {typeof category._count?.products === 'number' &&
                                category._count.products > 0 && (
                                  <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                                    {category._count.products}
                                  </span>
                                )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Footer strip */}
                <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-5 py-3">
                  <Link
                    href="/products?category=new-arrivals"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-medium text-gray-700 transition-colors hover:text-indigo-600"
                  >
                    ✦ New Arrivals
                  </Link>
                  <Link
                    href="/products"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-medium text-gray-700 transition-colors hover:text-indigo-600"
                  >
                    All Products
                  </Link>
                  <Link
                    href="/products"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg bg-[#c9a45c] px-3.5 py-1.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#d9b871]"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        <Link
          href="/cart"
          className="relative inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          Cart
          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

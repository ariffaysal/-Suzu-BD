import Link from 'next/link';
import type { Metadata } from 'next';
import ProductCard from '@/components/product/ProductCard';
import { getCategories, getProducts } from '@/services/products';
import { groupByCollection } from '@/services/categories';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Products',
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string; collection?: string }>;
}

const NEW_ARRIVALS_LIMIT = 12;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search, collection } = await searchParams;
  const isNewArrivals = category === 'new-arrivals';

  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({
      category: isNewArrivals ? undefined : category,
      collection: isNewArrivals ? undefined : collection,
      search,
    }).catch(() => []),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);
  const visibleProducts = isNewArrivals ? products.slice(0, NEW_ARRIVALS_LIMIT) : products;
  const groups = groupByCollection(categories);
  const activeCollection = groups.find((g) => g.key === collection?.toUpperCase());
  const visibleGroups = collection ? (activeCollection ? [activeCollection] : []) : groups;

  const heading = isNewArrivals
    ? 'New Arrivals'
    : activeCategory
      ? activeCategory.name
      : activeCollection
        ? activeCollection.label
        : 'All Products';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isNewArrivals ? '✦ New Arrivals' : heading}
        </h1>
        <p className="mt-1 text-gray-500">
          {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}
          {search ? ` matching “${search}”` : ''}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/products"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !category && !collection
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </Link>
          <Link
            href="/products?category=new-arrivals"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isNewArrivals
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✦ New Arrivals
          </Link>

          {/* Collection filters */}
          {groups.map((group) => (
            <Link
              key={group.key}
              href={`/products?collection=${group.key.toLowerCase()}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCollection?.key === group.key && !isNewArrivals
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {group.label.replace(' Collection', '')}
            </Link>
          ))}

          {visibleGroups.map((group) => (
            <div key={group.key} className="flex flex-wrap items-center gap-2">
              <span className="mx-1 hidden text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:inline">
                {group.label.replace(' Collection', '')}
              </span>
              {group.categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?collection=${group.key.toLowerCase()}&category=${c.slug}`}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    category === c.slug
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Native GET form — updates searchParams on submit, no client JS needed */}
        <form action="/products" method="GET" className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
          <input type="hidden" name="category" value={category ?? ''} readOnly />
          <input type="hidden" name="collection" value={collection ?? ''} readOnly />
          <input
            type="text"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Search products…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-600 sm:w-64"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Grid */}
      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <p className="text-gray-500">No products found.</p>
          <Link href="/products" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}

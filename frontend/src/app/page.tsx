import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import Logo from '@/components/brand/Logo';
import CollectionCard from '@/components/category/CollectionCard';
import CategoryPhotoCard from '@/components/category/CategoryPhotoCard';
import HeroSlider from '@/components/layout/HeroSlider';
import { getCategories, getProducts } from '@/services/products';
import { categoryIcon, groupByCollection } from '@/services/categories';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getProducts().catch(() => []),
  ]);
  const featured = products.slice(0, 8);
  const groups = groupByCollection(categories);
  const menGroup = groups.find((g) => g.key === 'MEN');
  const womenGroup = groups.find((g) => g.key === 'WOMEN');
  const accessoriesGroup = groups.find((g) => g.key === 'ACCESSORIES');

  const ACCESSORY_IMAGES: Record<string, string> = {
    bags: '/images/bags.png',
    'watches-jewellery': '/images/watches-jewellery.png',
  };

  return (
    <div className="space-y-16">
      {/* Hero — auto-sliding image carousel (slides managed in the database) */}
      <HeroSlider>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Logo
            variant="full"
            monogramClassName="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
            wordmarkClassName="text-2xl sm:text-3xl"
            ruleClassName="max-w-[180px]"
          />
          <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-amber-300">
            New Season Collection
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Step Into Style. Pay on Delivery.
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Premium sneakers, running shoes and formal footwear — delivered to your door with
            cash on delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-lg bg-[#c9a45c] px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg shadow-[#c9a45c]/25 transition-colors hover:bg-[#d9b871]"
            >
              Shop Now
            </Link>
            <Link
              href="/products?category=men-sneakers"
              className="rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              Explore Sneakers
            </Link>
          </div>
        </div>
      </HeroSlider>

      {/* Category grid */}
      {categories.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/products" className="text-sm font-medium text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>

          {/* Quick links: New Arrivals + All Products */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/products?category=new-arrivals"
              className="group flex items-center gap-4 rounded-2xl bg-gray-900 p-5 text-white transition-shadow hover:shadow-lg"
            >
              <span className="text-2xl text-[#d9b871]">✦</span>
              <span>
                <span className="block font-semibold">New Arrivals</span>
                <span className="mt-0.5 block text-xs text-gray-400">
                  Fresh drops, newest first
                </span>
              </span>
            </Link>
            <Link
              href="/products"
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-lg"
            >
              <span className="text-2xl text-[#a87f3f]">✦</span>
              <span>
                <span className="block font-semibold text-gray-900">All Products</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Browse the full collection
                </span>
              </span>
            </Link>
          </div>

          {/* Men + Women collection cards */}
          {(menGroup || womenGroup) && (
            <div className="mb-10 grid gap-6 md:grid-cols-2">
              {menGroup && (
                <CollectionCard
                  image="/images/men-collection.png"
                  title="Men Collection"
                  tagline="Sneakers, formal shoes, boots and more — built to last."
                  categories={menGroup.categories}
                  href="/products?collection=men"
                />
              )}
              {womenGroup && (
                <CollectionCard
                  image="/images/women-collection.png"
                  title="Women Collection"
                  tagline="Trendy, comfortable styles for every occasion."
                  categories={womenGroup.categories}
                  href="/products?collection=women"
                />
              )}
            </div>
          )}

          {/* Accessories */}
          {accessoriesGroup && (
            <div className="mb-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                {accessoriesGroup.label}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {accessoriesGroup.categories.map((category) => {
                  const image = ACCESSORY_IMAGES[category.slug];
                  if (image) {
                    return <CategoryPhotoCard key={category.id} category={category} image={image} />;
                  }
                  return (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      className="group rounded-2xl border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-md"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-xl">
                        {categoryIcon(category.slug)}
                      </div>
                      <p className="mt-3 font-semibold text-gray-900 group-hover:text-indigo-600">
                        {category.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {category._count?.products ?? 0} products
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* New arrivals */}
      {featured.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-gray-900">✦ New Arrivals</h2>
            <Link href="/products?category=new-arrivals" className="text-sm font-medium text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Cash on Delivery', text: 'Pay when your order arrives' },
          { title: 'Free Shipping', text: 'On orders over $100' },
          { title: 'Easy Returns', text: '7-day return guarantee' },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="font-semibold text-gray-900">{item.title}</p>
            <p className="mt-1 text-sm text-gray-500">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

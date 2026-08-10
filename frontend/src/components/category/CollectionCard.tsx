import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types';
import { categoryIcon } from '@/services/categories';

interface CollectionCardProps {
  image: string;
  title: string;
  tagline: string;
  categories: Category[];
  href: string;
}

export default function CollectionCard({
  image,
  title,
  tagline,
  categories,
  href,
}: CollectionCardProps) {
  return (
    <div className="collection-card group relative overflow-hidden rounded-3xl shadow-lg">
      {/* Clickable picture — the whole image area links to the collection */}
      <Link
        href={href}
        aria-label={`${title} — view collection`}
        className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300/70"
      >
        {/* Animated background image (Ken Burns) */}
        <div className="collection-kenburns absolute inset-0">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </div>

        {/* Readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/95 via-gray-950/45 to-gray-950/15 transition-colors duration-500 group-hover:via-gray-950/30" />
      </Link>

      {/* Content overlay — pointer-events pass through to the link except on the buttons */}
      <div className="pointer-events-none relative z-10 flex min-h-[420px] flex-col justify-end p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e3c88b]">✦ Collection</p>
        <h3 className="mt-1.5 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-gray-200">{tagline}</p>

        <div className="pointer-events-auto mt-5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              {categoryIcon(category.slug)} {category.name}
            </Link>
          ))}
        </div>

        <Link
          href="/products"
          className="pointer-events-auto mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-[#c9a45c] px-5 py-2.5 text-sm font-semibold text-gray-950 shadow-lg shadow-[#c9a45c]/25 transition-colors group-hover:bg-[#d9b871]"
        >
          Shop {title}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

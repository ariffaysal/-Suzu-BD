import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types';

interface CategoryPhotoCardProps {
  category: Category;
  image: string;
}

export default function CategoryPhotoCard({ category, image }: CategoryPhotoCardProps) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="collection-card group relative block overflow-hidden rounded-2xl shadow-md"
    >
      {/* Animated background image (Ken Burns) */}
      <div className="collection-kenburns absolute inset-0">
        <Image
          src={image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      </div>

      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/35 to-gray-950/10 transition-colors duration-500 group-hover:via-gray-950/25" />

      <div className="relative flex min-h-[280px] flex-col justify-end p-5 sm:p-6">
        <h4 className="text-xl font-bold text-white">{category.name}</h4>
        <p className="mt-0.5 text-xs text-gray-200">
          {category._count?.products ?? 0} products
        </p>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#c9a45c] px-3.5 py-1.5 text-xs font-semibold text-gray-950 transition-colors group-hover:bg-[#d9b871]">
          Shop now
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

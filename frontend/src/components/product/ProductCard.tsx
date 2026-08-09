import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { assetUrl } from '@/services/api';
import { discountPercent, formatPrice } from '@/services/format';
import Badge from '@/components/ui/Badge';

export default function ProductCard({ product }: { product: Product }) {
  const image = assetUrl(product.images[0]?.url);
  const discount = discountPercent(product.regularPrice, product.discountPrice);
  const sizes = [...new Set(product.variants.map((v) => v.size))].sort(
    (a, b) => Number(a) - Number(b),
  );

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            No image
          </div>
        )}
        {discount ? (
          <Badge className="absolute left-3 top-3">-{discount}%</Badge>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-gray-900">{product.title}</h3>
        {product.category ? (
          <p className="mt-0.5 text-xs text-gray-500">{product.category.name}</p>
        ) : null}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">
            {formatPrice(product.discountPrice ?? product.regularPrice)}
          </span>
          {product.discountPrice ? (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.regularPrice)}
            </span>
          ) : null}
        </div>

        {sizes.length > 0 ? (
          <p className="mt-1.5 text-xs text-gray-500">Sizes: {sizes.join(' · ')}</p>
        ) : null}
      </div>
    </Link>
  );
}

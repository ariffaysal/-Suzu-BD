import Link from 'next/link';
import type { Metadata } from 'next';
import ProductDetail from '@/components/product/ProductDetail';
import { getProduct } from '@/services/products';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);
  return { title: product?.title ?? 'Product' };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);

  if (!product) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
        <p className="text-lg font-semibold text-gray-900">Product not found</p>
        <p className="mt-1 text-sm text-gray-500">
          It may have been removed or the link is incorrect.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-indigo-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-indigo-600">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.title}</span>
      </nav>
      <ProductDetail product={product} />
    </div>
  );
}

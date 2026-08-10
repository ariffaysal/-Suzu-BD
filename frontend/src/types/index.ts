export interface Category {
  id: number;
  name: string;
  slug: string;
  collection?: string | null;
  _count?: { products: number };
}

export interface ProductVariant {
  id: number;
  productId: number;
  size: string;
  color?: string | null;
  stock: number;
}

export interface ProductImage {
  id: number;
  url: string;
  productId: number;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  regularPrice: number;
  discountPrice?: number | null;
  categoryId: number;
  category?: Category | null;
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color?: string | null;
  quantity: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  size: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  address: string;
  paymentMethod?: string;
  items: { productId: number; size: string; quantity: number }[];
}

export interface HeroSlide {
  id: number;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Admin identity as returned by the JWT payload from GET /api/auth/me. */
export interface Admin {
  sub: number;
  email: string;
  name?: string | null;
}

export type Collection = 'MEN' | 'WOMEN' | 'ACCESSORIES';

export interface CreateProductInput {
  title: string;
  slug?: string;
  description?: string;
  regularPrice: number;
  discountPrice?: number | null;
  categoryId: number;
  variants?: { size: string; color?: string | null; stock?: number }[];
  images?: { url: string }[];
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  collection?: Collection;
}

export interface UploadResponse {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

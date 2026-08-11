import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

interface CartLine {
  productId: number;
  size: string;
  color?: string | null;
  quantity: number;
}

export interface CartLineItem {
  productId: number;
  title: string;
  slug: string;
  regularPrice: number;
  discountPrice: number | null;
  image: string | null;
  size: string;
  color?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// In-memory session store keyed by a client id (e.g. generated UUID stored in the
// browser). Swap for Redis in production for multi-instance support.
//
// The client id is attacker-controlled, so the store is bounded: a fixed number
// of carts, a fixed number of lines per cart, and a fixed max quantity per line
// prevent an attacker from growing memory without limit.
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly carts = new Map<string, CartLine[]>();

  private static readonly MAX_CARTS = 10_000;
  private static readonly MAX_LINES_PER_CART = 50;
  private static readonly MAX_QUANTITY_PER_LINE = 99;

  async getCart(clientId: string) {
    return this.enrich(this.carts.get(clientId) ?? []);
  }

  async addItem(clientId: string, dto: AddCartItemDto) {
    await this.assertVariantExists(dto.productId, dto.size);
    const quantity = Math.min(dto.quantity ?? 1, CartService.MAX_QUANTITY_PER_LINE);
    const lines = this.carts.get(clientId) ?? [];
    const existing = lines.find(
      (line) => line.productId === dto.productId && line.size === dto.size,
    );
    if (existing) {
      existing.quantity = Math.min(
        existing.quantity + quantity,
        CartService.MAX_QUANTITY_PER_LINE,
      );
    } else {
      if (lines.length >= CartService.MAX_LINES_PER_CART) {
        throw new BadRequestException(
          `Cart is full (max ${CartService.MAX_LINES_PER_CART} items)`,
        );
      }
      lines.push({
        productId: dto.productId,
        size: dto.size,
        color: dto.color ?? null,
        quantity,
      });
    }
    this.evictOldestIfNeeded();
    this.carts.set(clientId, lines);
    return this.enrich(lines);
  }

  async updateQuantity(clientId: string, productId: number, size: string, quantity: number) {
    const lines = this.carts.get(clientId) ?? [];
    const line = lines.find((l) => l.productId === productId && l.size === size);
    if (!line) {
      throw new NotFoundException('Cart item not found');
    }
    if (quantity <= 0) {
      this.removeItem(clientId, productId, size);
    } else {
      line.quantity = Math.min(quantity, CartService.MAX_QUANTITY_PER_LINE);
      this.carts.set(clientId, lines);
    }
    return this.enrich(this.carts.get(clientId) ?? []);
  }

  async removeItem(clientId: string, productId: number, size: string) {
    const lines = (this.carts.get(clientId) ?? []).filter(
      (l) => !(l.productId === productId && l.size === size),
    );
    this.carts.set(clientId, lines);
    return this.enrich(lines);
  }

  async clearCart(clientId: string) {
    this.carts.delete(clientId);
    return { items: [], totalAmount: 0 };
  }

  /** Keeps the store bounded: evicts the oldest-inserted cart when at capacity. */
  private evictOldestIfNeeded(): void {
    if (this.carts.size < CartService.MAX_CARTS) return;
    const oldest = this.carts.keys().next().value;
    if (oldest !== undefined) {
      this.carts.delete(oldest);
    }
  }

  private async assertVariantExists(productId: number, size: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { productId, size },
    });
    if (!variant) {
      throw new NotFoundException(`Size ${size} not available for product ${productId}`);
    }
  }

  private async enrich(lines: CartLine[]) {
    if (lines.length === 0) {
      return { items: [] as CartLineItem[], totalAmount: 0 };
    }
    const productIds = [...new Set(lines.map((line) => line.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const items: CartLineItem[] = lines.flatMap((line) => {
      const product = productMap.get(line.productId);
      if (!product) return [];
      const unitPrice = product.discountPrice ?? product.regularPrice;
      return [
        {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          regularPrice: product.regularPrice,
          discountPrice: product.discountPrice,
          image: product.images[0]?.url ?? null,
          size: line.size,
          color: line.color,
          quantity: line.quantity,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        },
      ];
    });

    const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { items, totalAmount };
  }
}

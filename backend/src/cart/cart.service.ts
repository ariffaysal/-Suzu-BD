import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

/**
 * Session cart keyed by a client id (browser-generated UUID sent as the
 * `x-client-id` header). Carts live in Postgres — not memory — so they survive
 * restarts and work across multiple serverless instances.
 *
 * The client id is attacker-controlled, so it is capped in the controller
 * (64 chars) and the cart itself is bounded here: a fixed number of lines per
 * cart and a fixed max quantity per line. Idle carts are swept after
 * CART_TTL_MS so abandoned client ids cannot grow the table without limit.
 */
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly MAX_LINES_PER_CART = 50;
  private static readonly MAX_QUANTITY_PER_LINE = 99;
  private static readonly CART_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

  async getCart(clientId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { clientId },
      include: { items: true },
    });
    return this.enrich(cart?.items ?? []);
  }

  async addItem(clientId: string, dto: AddCartItemDto) {
    await this.assertVariantExists(dto.productId, dto.size);
    const quantity = Math.min(
      dto.quantity ?? 1,
      CartService.MAX_QUANTITY_PER_LINE,
    );

    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { clientId },
        update: { updatedAt: new Date() },
        create: { clientId },
        include: { items: true },
      });

      const existing = cart.items.find(
        (line) => line.productId === dto.productId && line.size === dto.size,
      );
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: Math.min(
              existing.quantity + quantity,
              CartService.MAX_QUANTITY_PER_LINE,
            ),
          },
        });
      } else {
        if (cart.items.length >= CartService.MAX_LINES_PER_CART) {
          throw new BadRequestException(
            `Cart is full (max ${CartService.MAX_LINES_PER_CART} items)`,
          );
        }
        await tx.cartItem.create({
          data: {
            cartId: clientId,
            productId: dto.productId,
            size: dto.size,
            color: dto.color ?? null,
            quantity,
          },
        });
      }
    });

    await this.sweepExpiredCarts();
    return this.getCart(clientId);
  }

  async updateQuantity(
    clientId: string,
    productId: number,
    size: string,
    quantity: number,
  ) {
    const line = await this.prisma.cartItem.findUnique({
      where: { cartId_productId_size: { cartId: clientId, productId, size } },
    });
    if (!line) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: line.id } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: line.id },
        data: {
          quantity: Math.min(quantity, CartService.MAX_QUANTITY_PER_LINE),
        },
      });
    }
    await this.touchCart(clientId);
    return this.getCart(clientId);
  }

  async removeItem(clientId: string, productId: number, size: string) {
    await this.prisma.cartItem.deleteMany({
      where: { cartId: clientId, productId, size },
    });
    await this.touchCart(clientId);
    return this.getCart(clientId);
  }

  async clearCart(clientId: string) {
    await this.prisma.cart.deleteMany({ where: { clientId } });
    return { items: [] as CartLineItem[], totalAmount: 0 };
  }

  /** Bumps updatedAt so an active cart never ages out of the idle sweep. */
  private async touchCart(clientId: string): Promise<void> {
    await this.prisma.cart.updateMany({
      where: { clientId },
      data: { updatedAt: new Date() },
    });
  }

  /** Deletes carts untouched for CART_TTL_MS — keeps the table bounded. */
  private async sweepExpiredCarts(): Promise<void> {
    await this.prisma.cart.deleteMany({
      where: {
        updatedAt: { lt: new Date(Date.now() - CartService.CART_TTL_MS) },
      },
    });
  }

  private async assertVariantExists(productId: number, size: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { productId, size },
    });
    if (!variant) {
      throw new NotFoundException(
        `Size ${size} not available for product ${productId}`,
      );
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
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

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

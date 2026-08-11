import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'DELIVERED',
  'CANCELLED',
] as const;

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const ORDER_STATS_PERIODS = [
  { key: '1d', days: 1 },
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: 'all', days: null },
] as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    // Prices are always computed server-side from the DB, never trusted from the client.
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      const variant = product.variants.find((v) => v.size === item.size);
      if (!variant) {
        throw new BadRequestException(
          `Size ${item.size} not available for ${product.title}`,
        );
      }
      const price = product.discountPrice ?? product.regularPrice;
      return {
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        price,
      };
    });

    // Aggregate requested quantities per variant. Duplicate line entries for the
    // same (productId, size) must not each pass the stock check independently,
    // or the total decrement could exceed the stock on hand.
    const requestedByVariant = new Map<string, number>();
    for (const item of orderItems) {
      const key = `${item.productId}:${item.size}`;
      requestedByVariant.set(
        key,
        (requestedByVariant.get(key) ?? 0) + item.quantity,
      );
    }
    for (const [key, total] of requestedByVariant) {
      const [productId, size] = key.split(':');
      const product = productMap.get(Number(productId));
      const variant = product?.variants.find((v) => v.size === size);
      if (variant && variant.stock < total) {
        throw new BadRequestException(
          `Insufficient stock for ${product!.title} (size ${size})`,
        );
      }
    }

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerName: dto.customerName,
          phone: dto.phone,
          address: dto.address,
          totalAmount,
          paymentMethod: dto.paymentMethod ?? 'COD',
          status: 'PENDING',
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // Atomically decrement stock. The `stock: { gte: quantity }` condition makes
      // the update race-safe: if another order already drained the stock, the
      // update matches nothing and this transaction is rolled back instead of
      // driving the stock negative.
      for (const [key, quantity] of requestedByVariant) {
        const [productId, size] = key.split(':');
        const result = await tx.productVariant.updateMany({
          where: {
            productId: Number(productId),
            size,
            stock: { gte: quantity },
          },
          data: { stock: { decrement: quantity } },
        });
        if (result.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for size ${size} — please refresh and try again`,
          );
        }
      }
      return order;
    });
  }

  async findAll(query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, query.limit ?? DEFAULT_PAGE_SIZE),
    );
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count(),
    ]);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Order counts + revenue for the admin dashboard (1d / 7d / 30d / all time). */
  async stats() {
    const now = Date.now();
    const results = await Promise.all(
      ORDER_STATS_PERIODS.map(async (period) => {
        const since =
          period.days === null
            ? undefined
            : new Date(now - period.days * 24 * 60 * 60 * 1000);
        const where = since ? { createdAt: { gte: since } } : {};
        const [count, aggregate] = await Promise.all([
          this.prisma.order.count({ where }),
          this.prisma.order.aggregate({ where, _sum: { totalAmount: true } }),
        ]);
        return {
          key: period.key,
          count,
          total: aggregate._sum.totalAmount ?? 0,
        };
      }),
    );
    return results;
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, status: string) {
    if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      throw new BadRequestException(
        `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
      );
    }
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    await this.prisma.order.delete({ where: { id } });
    return { deleted: true, id };
  }
}

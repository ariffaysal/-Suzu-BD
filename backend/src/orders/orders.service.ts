import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'DELIVERED',
  'CANCELLED',
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
    const productMap = new Map(products.map((product) => [product.id, product]));

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
      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.title} (size ${item.size})`,
        );
      }
      const price = product.discountPrice ?? product.regularPrice;
      return { productId: item.productId, size: item.size, quantity: item.quantity, price };
    });

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

      for (const item of orderItems) {
        await tx.productVariant.updateMany({
          where: { productId: item.productId, size: item.size },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return order;
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
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

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Collection, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const productInclude = {
  category: true,
  variants: true,
  images: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Categories ----------

  async categories() {
    // Enums are ordered by their declaration order (MEN, WOMEN, ACCESSORIES),
    // so `collection asc` keeps the collections grouped correctly.
    return this.prisma.category.findMany({
      orderBy: [{ collection: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.slug ?? this.slugify(dto.name);
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          slug,
          ...(dto.collection ? { collection: dto.collection } : {}),
        },
      });
    } catch (error) {
      if (this.isUniqueError(error)) {
        throw new ConflictException('Category slug already exists');
      }
      throw error;
    }
  }

  // ---------- Products ----------

  async findAll(query: {
    category?: string;
    search?: string;
    collection?: string;
  }) {
    const where: Prisma.ProductWhereInput = {};

    const categoryFilter: Prisma.CategoryWhereInput = {};
    if (query.collection) {
      const collection = query.collection.toUpperCase();
      if (!['MEN', 'WOMEN', 'ACCESSORIES'].includes(collection)) {
        throw new BadRequestException(
          `Unknown collection: ${query.collection}. Use men, women or accessories.`,
        );
      }
      categoryFilter.collection = collection as Collection;
    }
    if (query.category) {
      categoryFilter.slug = query.category;
    }
    if (Object.keys(categoryFilter).length > 0) {
      where.category = categoryFilter;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug ?? this.slugify(dto.title);
    try {
      return await this.prisma.product.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          regularPrice: dto.regularPrice,
          discountPrice: dto.discountPrice,
          categoryId: dto.categoryId,
          variants: { create: dto.variants ?? [] },
          images: { create: dto.images ?? [] },
        },
        include: productInclude,
      });
    } catch (error) {
      if (this.isUniqueError(error)) {
        throw new ConflictException('Product slug already exists');
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Replace variants/images when provided
      if (dto.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }
      if (dto.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.slug !== undefined && { slug: dto.slug }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.regularPrice !== undefined && { regularPrice: dto.regularPrice }),
          ...(dto.discountPrice !== undefined && { discountPrice: dto.discountPrice }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.variants !== undefined && { variants: { create: dto.variants } }),
          ...(dto.images !== undefined && { images: { create: dto.images } }),
        },
        include: productInclude,
      });
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ---------- Helpers ----------

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }

  private isUniqueError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}

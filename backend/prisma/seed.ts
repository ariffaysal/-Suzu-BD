import { Collection, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SHOE_SIZES = ['40', '41', '42', '43', '44'];
const CLOTH_SIZES = ['S', 'M', 'L', 'XL'];
const ONE_SIZE = ['One Size'];

const categories = [
  // MEN COLLECTION
  { collection: Collection.MEN, name: 'Sneakers', slug: 'men-sneakers' },
  { collection: Collection.MEN, name: 'Formal Shoe', slug: 'men-formal-shoe' },
  { collection: Collection.MEN, name: 'Casual Shoe', slug: 'men-casual-shoe' },
  {
    collection: Collection.MEN,
    name: 'Loafers Shoe',
    slug: 'men-loafers-shoe',
  },
  { collection: Collection.MEN, name: 'Sports Shoe', slug: 'men-sports-shoe' },
  { collection: Collection.MEN, name: 'Boots', slug: 'men-boots' },
  { collection: Collection.MEN, name: 'Clothes', slug: 'men-clothes' },
  // WOMEN COLLECTION
  { collection: Collection.WOMEN, name: 'Sneakers', slug: 'women-sneakers' },
  {
    collection: Collection.WOMEN,
    name: 'Formal Shoe',
    slug: 'women-formal-shoe',
  },
  {
    collection: Collection.WOMEN,
    name: 'Casual Shoe',
    slug: 'women-casual-shoe',
  },
  {
    collection: Collection.WOMEN,
    name: 'Loafers Shoe',
    slug: 'women-loafers-shoe',
  },
  {
    collection: Collection.WOMEN,
    name: 'Sports Shoe',
    slug: 'women-sports-shoe',
  },
  { collection: Collection.WOMEN, name: 'Boots', slug: 'women-boots' },
  { collection: Collection.WOMEN, name: 'Clothes', slug: 'women-clothes' },
  // ACCESSORIES
  {
    collection: Collection.ACCESSORIES,
    name: 'Watches & Jewellery',
    slug: 'watches-jewellery',
  },
  { collection: Collection.ACCESSORIES, name: 'Bags', slug: 'bags' },
];

interface SeedProduct {
  title: string;
  slug: string;
  description: string;
  regularPrice: number;
  discountPrice: number | null;
  categorySlug: string;
  colors: string[];
  sizes: string[];
}

const products: SeedProduct[] = [
  // ---- MEN COLLECTION ----
  {
    title: 'AirFlex Runner Sneakers',
    slug: 'airflex-runner-sneakers',
    description:
      'Lightweight breathable mesh sneakers with cushioned sole, perfect for everyday wear and light running.',
    regularPrice: 89.99,
    discountPrice: 64.99,
    categorySlug: 'men-sneakers',
    colors: ['White', 'Black'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'ProStride Sports Shoes',
    slug: 'prostride-running-shoes',
    description:
      'High-performance sports shoes with responsive foam midsole and durable outsole for long distances.',
    regularPrice: 119.99,
    discountPrice: null,
    categorySlug: 'men-sports-shoe',
    colors: ['Blue', 'Grey'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Oxford Leather Formal Shoes',
    slug: 'oxford-leather-formal-shoes',
    description:
      'Classic polished leather oxford shoes for office and formal occasions.',
    regularPrice: 149.99,
    discountPrice: 109.99,
    categorySlug: 'men-formal-shoe',
    colors: ['Black'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Beach Slide Sandals',
    slug: 'beach-slide-sandals',
    description:
      'Comfortable quick-dry slide sandals with soft padded footbed.',
    regularPrice: 29.99,
    discountPrice: null,
    categorySlug: 'men-casual-shoe',
    colors: ['Brown', 'Navy'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Urban Combat Boots',
    slug: 'urban-combat-boots',
    description:
      'Durable high-top boots with rugged grip, built for city and trail alike.',
    regularPrice: 129.99,
    discountPrice: 99.99,
    categorySlug: 'men-boots',
    colors: ['Tan'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Aviator Leather Loafers',
    slug: 'aviator-leather-loafers',
    description:
      'Premium slip-on leather loafers with a refined, timeless finish.',
    regularPrice: 109.99,
    discountPrice: 84.99,
    categorySlug: 'men-loafers-shoe',
    colors: ['Black', 'Brown'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Urban Slim-Fit T-Shirt',
    slug: 'urban-slim-fit-t-shirt',
    description:
      'Soft cotton slim-fit t-shirt, breathable and comfortable for everyday wear.',
    regularPrice: 24.99,
    discountPrice: null,
    categorySlug: 'men-clothes',
    colors: ['White', 'Black', 'Grey'],
    sizes: CLOTH_SIZES,
  },
  // ---- WOMEN COLLECTION ----
  {
    title: 'Grace Feather Sneakers',
    slug: 'grace-feather-sneakers',
    description:
      'Feather-light women sneakers with a cushioned sole and clean silhouette.',
    regularPrice: 79.99,
    discountPrice: 59.99,
    categorySlug: 'women-sneakers',
    colors: ['White', 'Pink'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Elegant Heeled Formal Shoes',
    slug: 'elegant-heeled-formal-shoes',
    description:
      'Chic heeled formal shoes designed for office and evening occasions.',
    regularPrice: 129.99,
    discountPrice: null,
    categorySlug: 'women-formal-shoe',
    colors: ['Black', 'Nude'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Breeze Comfort Casual Shoes',
    slug: 'breeze-comfort-casual-shoes',
    description:
      'All-day comfort casual shoes with a flexible, cushioned footbed.',
    regularPrice: 69.99,
    discountPrice: 49.99,
    categorySlug: 'women-casual-shoe',
    colors: ['White', 'Beige'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Pearl Slip-On Loafers',
    slug: 'pearl-slip-on-loafers',
    description:
      'Elegant slip-on loafers with a soft finish — effortless style in one step.',
    regularPrice: 89.99,
    discountPrice: null,
    categorySlug: 'women-loafers-shoe',
    colors: ['Black', 'Brown'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'FlexMove Women Sports Shoes',
    slug: 'flexmove-women-sports-shoes',
    description:
      'Bouncy, breathable sports shoes tuned for running and gym training.',
    regularPrice: 99.99,
    discountPrice: 79.99,
    categorySlug: 'women-sports-shoe',
    colors: ['Pink', 'Grey'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Highland Women Ankle Boots',
    slug: 'highland-women-ankle-boots',
    description:
      'Trendy ankle boots with a chunky sole and soft lining for all seasons.',
    regularPrice: 119.99,
    discountPrice: 94.99,
    categorySlug: 'women-boots',
    colors: ['Black', 'Tan'],
    sizes: SHOE_SIZES,
  },
  {
    title: 'Floral Summer Dress',
    slug: 'floral-summer-dress',
    description:
      'Lightweight floral dress, perfect for warm days and casual outings.',
    regularPrice: 44.99,
    discountPrice: 34.99,
    categorySlug: 'women-clothes',
    colors: ['Floral', 'Solid Blue'],
    sizes: CLOTH_SIZES,
  },
  // ---- ACCESSORIES ----
  {
    title: 'Classic Minimalist Watch',
    slug: 'classic-minimalist-watch',
    description:
      'A timeless analog watch with a leather strap — understated and elegant.',
    regularPrice: 89.99,
    discountPrice: 69.99,
    categorySlug: 'watches-jewellery',
    colors: ['Black', 'Brown'],
    sizes: ONE_SIZE,
  },
  {
    title: 'Leather Everyday Tote Bag',
    slug: 'leather-everyday-tote-bag',
    description:
      'Spacious genuine-leather tote with reinforced handles for daily carry.',
    regularPrice: 74.99,
    discountPrice: null,
    categorySlug: 'bags',
    colors: ['Tan', 'Black'],
    sizes: ONE_SIZE,
  },
];

async function main() {
  // Seed admin user (JWT login: admin@footwear.com / admin123)
  const adminEmail = 'admin@footwear.com';
  const password = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password, name: 'Store Admin' },
  });
  console.log('✓ Admin user ready:', adminEmail);

  // Seed categories with their collection
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { collection: category.collection },
      create: category,
    });
  }
  console.log('✓ Categories seeded:', categories.length);

  // Seed products (remaps existing products to the new categories)
  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
    });
    if (!category) {
      console.warn(`⚠ Category not found for product: ${product.slug}`);
      continue;
    }

    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });
    if (existing) {
      await prisma.product.update({
        where: { slug: product.slug },
        data: { title: product.title, categoryId: category.id },
      });
      console.log('✓ Product remapped:', product.title);
      continue;
    }

    const variants = product.colors.flatMap((color) =>
      product.sizes.map((size) => ({
        size,
        color,
        stock: Math.floor(Math.random() * 20) + 3,
      })),
    );
    const images = [1, 2, 3].map((n) => ({
      url: `https://picsum.photos/seed/${product.slug}-${n}/800/800`,
    }));

    await prisma.product.create({
      data: {
        title: product.title,
        slug: product.slug,
        description: product.description,
        regularPrice: product.regularPrice,
        discountPrice: product.discountPrice,
        categoryId: category.id,
        variants: { create: variants },
        images: { create: images },
      },
    });
    console.log('✓ Product seeded:', product.title);
  }

  // Remove stale categories that are no longer part of the structure
  // (runs after products are remapped, so old categories are empty by now)
  const validSlugs = new Set(categories.map((c) => c.slug));
  const stale = await prisma.category.findMany({
    where: { slug: { notIn: [...validSlugs] } },
    include: { _count: { select: { products: true } } },
  });
  for (const category of stale) {
    if (category._count.products > 0) {
      console.warn(`⚠ Skipping non-empty stale category: ${category.slug}`);
      continue;
    }
    await prisma.category.delete({ where: { id: category.id } });
    console.log('✓ Removed stale category:', category.slug);
  }

  console.log('Seed complete ✓');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

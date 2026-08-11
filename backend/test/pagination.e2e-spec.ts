import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * End-to-end tests for the paginated list endpoints. They run against a
 * dedicated PostgreSQL database (`footwear_test`) that is recreated from the
 * Prisma schema and seeded on every run, so they are deterministic and never
 * touch the dev database. Point TEST_DATABASE_URL elsewhere to run against a
 * different Postgres (e.g. in CI).
 */
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://footwear:footwear@localhost:5433/footwear_test';

const PRODUCT_COUNT = 30; // > default page size (24) so listing spans two pages

describe('Pagination (e2e)', () => {
  let app: INestApplication;
  let testPrisma: PrismaClient;
  let adminToken: string;

  beforeAll(async () => {
    // Recreate the test schema (idempotent; wipes any previous test data).
    execSync('npx --no-install prisma db push --force-reset --skip-generate --accept-data-loss', {
      cwd: join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'ignore',
      timeout: 120_000,
    });

    testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
    await testPrisma.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(testPrisma)
      .compile();

    // Mirror main.ts bootstrap so routes match the real API surface.
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    await seed(testPrisma);

    // Any token signed with the app's JWT secret passes the guard.
    adminToken = app.get(JwtService).sign({ sub: 1, email: 'admin@test.com' });
  });

  afterAll(async () => {
    await app.close();
    await testPrisma.$disconnect();
  });

  describe('GET /api/products (public)', () => {
    it('returns the first page with the default page size and envelope', async () => {
      const res = await request(app.getHttpServer()).get('/api/products').expect(200);
      expect(res.body).toEqual({
        items: expect.any(Array),
        total: PRODUCT_COUNT,
        page: 1,
        limit: 24,
        totalPages: 2,
      });
      expect(res.body.items).toHaveLength(24);
    });

    it('paginates with page and limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?page=2&limit=5')
        .expect(200);
      expect(res.body).toMatchObject({ page: 2, limit: 5, total: PRODUCT_COUNT, totalPages: 6 });
      expect(res.body.items).toHaveLength(5);
    });

    it('does not leak results past the last page', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?page=999&limit=10')
        .expect(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.totalPages).toBe(3);
    });

    it('caps limit at 500', async () => {
      const res = await request(app.getHttpServer()).get('/api/products?limit=9999').expect(200);
      expect(res.body.limit).toBe(500);
      expect(res.body.items).toHaveLength(PRODUCT_COUNT);
    });

    it('clamps out-of-range page and limit instead of erroring', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?page=0&limit=0')
        .expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 1 });
      expect(res.body.items).toHaveLength(1);
    });

    it('combines search with pagination', async () => {
      // "Test Product 1" matches ids 1 and 10..19 → 11 products.
      const res = await request(app.getHttpServer())
        .get('/api/products?search=Test%20Product%201')
        .expect(200);
      expect(res.body.total).toBe(11);
      expect(res.body.items).toHaveLength(11);
    });

    it('rejects non-numeric page/limit with 400', async () => {
      await request(app.getHttpServer()).get('/api/products?page=abc').expect(400);
      await request(app.getHttpServer()).get('/api/products?limit=abc').expect(400);
    });
  });

  describe('GET /api/orders (admin, JWT)', () => {
    it('rejects unauthenticated requests with 401', async () => {
      await request(app.getHttpServer()).get('/api/orders').expect(401);
    });

    it('rejects an invalid token with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', 'Bearer not-a-token')
        .expect(401);
    });

    it('returns the first page of orders for an admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toEqual({
        items: expect.any(Array),
        total: 4,
        page: 1,
        limit: 25,
        totalPages: 1,
      });
      expect(res.body.items).toHaveLength(4);
    });

    it('paginates orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders?page=2&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toMatchObject({ total: 4, page: 2, limit: 2, totalPages: 2 });
      expect(res.body.items).toHaveLength(2);
    });

    it('caps orders limit at 100', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders?limit=9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.limit).toBe(100);
      expect(res.body.items).toHaveLength(4);
    });

    it('rejects non-numeric page and id with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/orders?page=abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/orders/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/orders/stats (admin, JWT)', () => {
    it('requires authentication', async () => {
      await request(app.getHttpServer()).get('/api/orders/stats').expect(401);
    });

    it('computes counts and revenue per period across all orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const byKey = Object.fromEntries(res.body.map((s: { key: string }) => [s.key, s]));
      expect(Object.keys(byKey).sort()).toEqual(['1d', '30d', '7d', 'all']);
      // 3 recent orders (100 + 250 + 650) + 1 order from 45 days ago (500).
      expect(byKey['1d']).toEqual({ key: '1d', count: 3, total: 1000 });
      expect(byKey['7d']).toEqual({ key: '7d', count: 3, total: 1000 });
      expect(byKey['30d']).toEqual({ key: '30d', count: 3, total: 1000 });
      expect(byKey['all']).toEqual({ key: 'all', count: 4, total: 1500 });
    });
  });
});

/** Seeds a deterministic dataset for the pagination assertions. */
async function seed(prisma: PrismaClient): Promise<void> {
  const category = await prisma.category.create({
    data: { name: 'Test Shoes', slug: 'test-shoes' },
  });

  for (let i = 1; i <= PRODUCT_COUNT; i++) {
    await prisma.product.create({
      data: {
        title: `Test Product ${i}`,
        slug: `test-product-${i}`,
        description: 'seeded for tests',
        regularPrice: i * 10,
        categoryId: category.id,
        variants: { create: [{ size: '40', stock: 5 }] },
        images: { create: [{ url: '/uploads/test.png' }] },
      },
    });
  }

  const [first, second, third] = await prisma.product.findMany({
    orderBy: { id: 'asc' },
    take: 3,
  });

  const item = (productId: number) => [{ productId, size: '40', quantity: 1, price: 10 }];

  // Three recent orders (inside the 1d/7d/30d windows)…
  const recent = [
    { customerName: 'Alice', totalAmount: 100 },
    { customerName: 'Bob', totalAmount: 250 },
    { customerName: 'Carol', totalAmount: 650 },
  ];
  const products = [first, second, third];
  for (let i = 0; i < recent.length; i++) {
    await prisma.order.create({
      data: {
        customerName: recent[i].customerName,
        phone: `01${i}`,
        address: `Address ${i}`,
        totalAmount: recent[i].totalAmount,
        paymentMethod: 'COD',
        status: 'PENDING',
        items: { create: item(products[i].id) },
      },
    });
  }

  // …and one order from 45 days ago, only counted in "all time".
  await prisma.order.create({
    data: {
      customerName: 'Old Customer',
      phone: '0199',
      address: 'Old address',
      totalAmount: 500,
      paymentMethod: 'COD',
      status: 'CANCELLED',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      items: { create: item(first.id) },
    },
  });
}

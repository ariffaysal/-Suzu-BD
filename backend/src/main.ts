import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Trust the X-Forwarded-For header from a reverse proxy so rate limiting and
  // logging key on the real client IP. Only enabled in production; in dev the
  // API is reached directly and trusting the header would let clients spoof it.
  // Deploy behind a proxy that overwrites X-Forwarded-For and never expose the
  // API socket directly.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
  }

  // Security headers: nosniff, frame protection, CSP, HSTS, etc.
  app.use(helmet());

  // Strict CORS — only allowlisted origins may call the API.
  // Set CORS_ORIGINS as a comma-separated list (e.g. https://store.example.com,https://admin.example.com).
  const configuredOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  // The Next.js dev server auto-increments its port when 3000 is taken
  // (3001, 3002, …), so in development accept any localhost origin.
  const isDev = process.env.NODE_ENV !== 'production';
  const isLocalhost = (origin: string): boolean => {
    try {
      const { hostname } = new URL(origin);
      return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
      return false;
    }
  };
  app.enableCors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server) and allowlisted or dev-localhost origins.
      if (!origin || configuredOrigins.includes(origin) || (isDev && isLocalhost(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Serve uploaded product images at /uploads/*
  // The storefront loads these cross-origin (frontend port → API port), so relax
  // CORP for uploads — helmet's default `same-origin` would make browsers refuse
  // to render them from another origin.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}
void bootstrap();

import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  /** Trivial API banner — public, like the storefront routes. */
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Liveness + DB connectivity check — handy for deployment smoke tests
   * (curl <api>/api/health). Public on purpose.
   */
  @Public()
  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'up' };
  }
}

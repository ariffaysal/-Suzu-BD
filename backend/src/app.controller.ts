import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Trivial API banner — public, like the storefront routes. */
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

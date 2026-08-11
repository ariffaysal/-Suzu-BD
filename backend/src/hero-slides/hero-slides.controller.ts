import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/decorators/public.decorator';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';
import {
  HeroSlidesService,
  heroSlideMulterOptions,
} from './hero-slides.service';

@Controller('hero-slides')
export class HeroSlidesController {
  constructor(private readonly heroSlidesService: HeroSlidesService) {}

  /** Storefront slides (active only, ordered). */
  @Public()
  @Get()
  findActive() {
    return this.heroSlidesService.findActive();
  }

  /** Admin: every slide, including hidden ones. */
  @Get('all')
  findAll() {
    return this.heroSlidesService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', heroSlideMulterOptions))
  create(
    @Body() body: CreateHeroSlideDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.heroSlidesService.create(body, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', heroSlideMulterOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHeroSlideDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.heroSlidesService.update(id, body, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.heroSlidesService.remove(id);
  }
}

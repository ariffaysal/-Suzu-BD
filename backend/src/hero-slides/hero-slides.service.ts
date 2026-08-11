import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { assertValidImageFile, isAllowedImage } from '../uploads/uploads.service';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';

export const HERO_SLIDES_DIR = join(process.cwd(), 'uploads', 'hero-slides');

/** Multer config that stores uploaded hero images in uploads/hero-slides/. */
export const heroSlideMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: HERO_SLIDES_DIR,
    filename: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — hero images are larger than product shots
  fileFilter: (_req, file, callback) => {
    if (!isAllowedImage(file.originalname, file.mimetype)) {
      callback(
        new BadRequestException('Only PNG, JPG, JPEG, GIF, WEBP or AVIF images are allowed'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};

/** Verifies a freshly written hero image and cleans it up if it is not a real image. */
function verifyHeroImage(file: Express.Multer.File): void {
  assertValidImageFile(file, join(HERO_SLIDES_DIR, file.filename));
}

/**
 * True only when `imageUrl` points at a plain file inside the hero-slides
 * uploads directory. Defense in depth against path traversal: even a crafted
 * imageUrl (e.g. one stored before the DTO validation was tightened) can never
 * be unlinked from outside the uploads directory. The filename check (no `/`,
 * no `..`) is what guarantees containment, and it avoids path-resolution
 * differences between Windows and POSIX.
 */
function isManagedHeroImage(imageUrl: string): boolean {
  const PREFIX = '/uploads/hero-slides/';
  if (!imageUrl.startsWith(PREFIX)) return false;
  return /^[a-zA-Z0-9._-]+$/.test(imageUrl.slice(PREFIX.length));
}

@Injectable()
export class HeroSlidesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (!existsSync(HERO_SLIDES_DIR)) {
      mkdirSync(HERO_SLIDES_DIR, { recursive: true });
    }
  }

  /** Slides shown on the storefront, in display order. */
  findActive() {
    return this.prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
  }

  /** All slides, including hidden ones (admin). */
  findAll() {
    return this.prisma.heroSlide.findMany({
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
  }

  async create(dto: CreateHeroSlideDto, file?: Express.Multer.File) {
    if (file) {
      verifyHeroImage(file);
    }
    const imageUrl = file ? `/uploads/hero-slides/${file.filename}` : dto.imageUrl;
    if (!imageUrl) {
      throw new BadRequestException('Provide an image file or an imageUrl');
    }

    const max = await this.prisma.heroSlide.aggregate({
      _max: { position: true },
    });
    const position = dto.position ?? (max._max.position ?? 0) + 1;

    return this.prisma.heroSlide.create({
      data: {
        imageUrl,
        title: dto.title,
        subtitle: dto.subtitle,
        position,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateHeroSlideDto, file?: Express.Multer.File) {
    if (file) {
      verifyHeroImage(file);
    }
    const existing = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Hero slide ${id} not found`);
    }

    const imageUrl = file ? `/uploads/hero-slides/${file.filename}` : undefined;

    const updated = await this.prisma.heroSlide.update({
      where: { id },
      data: {
        ...(imageUrl !== undefined && { imageUrl }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    // Clean up the replaced image file from disk (best effort).
    if (file && isManagedHeroImage(existing.imageUrl)) {
      try {
        unlinkSync(join(process.cwd(), existing.imageUrl));
      } catch {
        // file already gone — ignore
      }
    }

    return updated;
  }

  async remove(id: number) {
    const existing = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Hero slide ${id} not found`);
    }
    await this.prisma.heroSlide.delete({ where: { id } });

    if (isManagedHeroImage(existing.imageUrl)) {
      try {
        unlinkSync(join(process.cwd(), existing.imageUrl));
      } catch {
        // file already gone — ignore
      }
    }

    return { deleted: true, id };
  }
}

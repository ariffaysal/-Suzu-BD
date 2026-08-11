import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { extname, join } from 'path';

/**
 * True when a Vercel Blob store is configured (BLOB_READ_WRITE_TOKEN present).
 * In this mode uploaded files are staged on the (ephemeral) function disk,
 * verified, pushed to Vercel Blob, then deleted locally — Vercel's filesystem
 * is not persistent, so Blob is where production images actually live.
 * Without the token the API keeps the original behavior: files are stored in
 * ./uploads and served at /uploads/* (local dev / self-hosted).
 */
export const BLOB_MODE = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const UPLOAD_DIR = BLOB_MODE
  ? join(tmpdir(), 'footwear-uploads')
  : join(process.cwd(), 'uploads');

/**
 * Only these extensions are ever stored. Notably SVG is excluded: SVG is
 * XML and can embed scripts, so serving it from our own origin would be a
 * stored-XSS vector. The client-supplied MIME type alone is never trusted.
 */
const ALLOWED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
];

/** Magic-byte signatures for each allowed format (checked after the file is written). */
const MAGIC_BYTES: {
  extensions: string[];
  test: (buffer: Buffer) => boolean;
}[] = [
  {
    extensions: ['.png'],
    test: (b) =>
      b.length >= 8 && b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG',
  },
  {
    extensions: ['.jpg', '.jpeg'],
    test: (b) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    extensions: ['.gif'],
    test: (b) => b.length >= 4 && b.toString('ascii', 0, 4) === 'GIF8',
  },
  {
    extensions: ['.webp'],
    test: (b) =>
      b.length >= 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
  {
    extensions: ['.avif'],
    test: (b) =>
      b.length >= 12 &&
      b.toString('ascii', 4, 8) === 'ftyp' &&
      (b.toString('ascii', 8, 12) === 'avif' ||
        b.toString('ascii', 8, 12) === 'avis'),
  },
];

export function isAllowedImage(
  originalname: string,
  mimetype: string,
): boolean {
  const extension = extname(originalname).toLowerCase();
  return (
    ALLOWED_IMAGE_EXTENSIONS.includes(extension) &&
    mimetype.startsWith('image/')
  );
}

/**
 * Verifies the bytes of a stored file actually match its claimed format.
 * Deletes the file and throws when the content is not a real image, so a
 * malicious payload (e.g. HTML renamed to .png) can never be served.
 */
export function assertValidImageFile(
  file: Express.Multer.File,
  savedPath: string,
): void {
  let buffer: Buffer;
  try {
    buffer = readFileSync(savedPath);
  } catch {
    throw new BadRequestException('Uploaded file could not be read');
  }

  const extension = extname(file.originalname).toLowerCase();
  const signature = MAGIC_BYTES.find((entry) =>
    entry.extensions.includes(extension),
  );
  if (!signature || !signature.test(buffer)) {
    try {
      unlinkSync(savedPath);
    } catch {
      // best effort cleanup
    }
    throw new BadRequestException('Uploaded file is not a valid image');
  }
}

export const multerOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, callback) => {
    if (!isAllowedImage(file.originalname, file.mimetype)) {
      callback(
        new BadRequestException(
          'Only PNG, JPG, JPEG, GIF, WEBP or AVIF images are allowed',
        ),
        false,
      );
      return;
    }
    callback(null, true);
  },
};

/**
 * Makes a verified uploaded file publicly addressable.
 *
 * - Blob mode: uploads the bytes to Vercel Blob and deletes the temp copy
 *   (the function filesystem is ephemeral), returning the absolute Blob URL.
 * - Disk mode: leaves the file in ./uploads and returns its local path
 *   (/uploads/<name>), served by the API's static assets.
 *
 * `folder` only affects the Blob pathname (e.g. "hero-slides"); it is ignored
 * in disk mode.
 */
export async function persistUploadedFile(
  file: Express.Multer.File,
  options?: { folder?: string },
): Promise<{ url: string; storedOn: 'blob' | 'disk' }> {
  const savedPath = join(UPLOAD_DIR, file.filename);
  assertValidImageFile(file, savedPath);

  if (BLOB_MODE) {
    const buffer = readFileSync(savedPath);
    const folder = options?.folder ?? 'uploads';
    const blob = await put(`${folder}/${file.filename}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    try {
      rmSync(savedPath, { force: true });
    } catch {
      // best effort cleanup
    }
    return { url: blob.url, storedOn: 'blob' };
  }

  return { url: `/uploads/${file.filename}`, storedOn: 'disk' };
}

@Injectable()
export class UploadsService implements OnModuleInit {
  onModuleInit() {
    // On Vercel the function filesystem is read-only (except /tmp) — only
    // matters in disk mode, so a failure here must never crash startup.
    if (!existsSync(UPLOAD_DIR)) {
      try {
        mkdirSync(UPLOAD_DIR, { recursive: true });
      } catch {
        // ignore — Blob mode does not need a writable uploads dir
      }
    }
  }
}

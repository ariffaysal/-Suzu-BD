import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { assertValidImageFile, multerOptions, UPLOAD_DIR } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  /** Admin uploads only — throttled to 20 files / minute / IP. */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // Never trust the client's MIME type or extension alone — verify the real
    // bytes before keeping the file on disk.
    assertValidImageFile(file, join(UPLOAD_DIR, file.filename));
    return {
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}

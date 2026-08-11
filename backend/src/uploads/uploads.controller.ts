import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, persistUploadedFile } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  /** Admin uploads only — throttled to 20 files / minute / IP. */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // Never trust the client's MIME type or extension alone — the real bytes
    // are verified before the file is kept (on disk or in Vercel Blob).
    const { url } = await persistUploadedFile(file);
    return {
      url,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}

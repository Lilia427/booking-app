import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadedImageFile } from './types/uploaded-image-file.type';

@Injectable()
export class S3StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_DEFAULT_REGION', 'eu-north-1');
    this.bucket = this.configService.get<string>('ASSETS_BUCKET', '');

    if (!this.bucket) {
      throw new InternalServerErrorException('ASSETS_BUCKET is not configured');
    }

    this.client = new S3Client({ region: this.region });
  }

  async uploadImages(files: UploadedImageFile[]): Promise<string[]> {
    if (!files.length) {
      return [];
    }

    const uploadedKeys = await Promise.all(
      files.map(async (file) => {
        const key = this.createObjectKey(file.originalname);

        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );

        return key;
      }),
    );

    return uploadedKeys;
  }

  async deleteByKeys(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );
  }

  toPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private createObjectKey(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

    return `cottages/${timestamp}-${random}-${safeName}`;
  }
}

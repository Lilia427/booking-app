import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { CottageController } from './cottage.controller';
import { CottageService } from './cottage.service';
import { CottageEntity } from './entities/cottage.entity';
import { S3StorageService } from './s3-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([CottageEntity]), AdminModule],
  controllers: [CottageController],
  providers: [CottageService, S3StorageService],
  exports: [CottageService],
})
export class CottageModule {}

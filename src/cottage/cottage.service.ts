import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCottageDto } from './dto/create-cottage.dto';
import { UpdateCottageDto } from './dto/update-cottage.dto';
import { CottageEntity } from './entities/cottage.entity';
import { S3StorageService } from './s3-storage.service';
import { UploadedImageFile } from './types/uploaded-image-file.type';

@Injectable()
export class CottageService {
  constructor(
    @InjectRepository(CottageEntity)
    private readonly cottageRepository: Repository<CottageEntity>,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async create(
    createCottageDto: CreateCottageDto,
    files: UploadedImageFile[],
  ) {
    const uploadedKeys = await this.s3StorageService.uploadImages(files);

    const cottage = this.cottageRepository.create({
      ...createCottageDto,
      imageKeys: uploadedKeys,
      isActive: createCottageDto.isActive ?? true,
    });

    const saved = await this.cottageRepository.save(cottage);
    return this.toResponse(saved);
  }

  async findAll() {
    const cottages = await this.cottageRepository.find({ order: { id: 'ASC' } });
    return cottages.map((cottage) => this.toResponse(cottage));
  }

  async findOne(id: number) {
    const cottage = await this.cottageRepository.findOneBy({ id });

    if (!cottage) {
      throw new NotFoundException(`Cottage with id ${id} not found`);
    }

    return this.toResponse(cottage);
  }

  async update(
    id: number,
    updateCottageDto: UpdateCottageDto,
    files: UploadedImageFile[],
  ) {
    const cottage = await this.cottageRepository.findOneBy({ id });

    if (!cottage) {
      throw new NotFoundException(`Cottage with id ${id} not found`);
    }

    const removeKeys = updateCottageDto.removeImageKeys ?? [];
    const removableKeys = cottage.imageKeys.filter((key) => removeKeys.includes(key));

    if (removableKeys.length) {
      await this.s3StorageService.deleteByKeys(removableKeys);
    }

    const uploadedKeys = await this.s3StorageService.uploadImages(files);
    const remainingKeys = cottage.imageKeys.filter((key) => !removeKeys.includes(key));

    const merged = this.cottageRepository.merge(cottage, {
      ...updateCottageDto,
      imageKeys: [...remainingKeys, ...uploadedKeys],
    });

    const saved = await this.cottageRepository.save(merged);
    return this.toResponse(saved);
  }

  async remove(id: number) {
    const cottage = await this.cottageRepository.findOneBy({ id });

    if (!cottage) {
      throw new NotFoundException(`Cottage with id ${id} not found`);
    }

    if (cottage.imageKeys.length) {
      await this.s3StorageService.deleteByKeys(cottage.imageKeys);
    }

    await this.cottageRepository.remove(cottage);

    return {
      deleted: true,
      id,
    };
  }

  private toResponse(cottage: CottageEntity) {
    return {
      ...cottage,
      imageUrls: cottage.imageKeys.map((key) => this.s3StorageService.toPublicUrl(key)),
    };
  }
}

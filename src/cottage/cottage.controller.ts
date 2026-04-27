import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard';
import { CottageService } from './cottage.service';
import { CreateCottageDto } from './dto/create-cottage.dto';
import { UpdateCottageDto } from './dto/update-cottage.dto';
import { UploadedImageFile } from './types/uploaded-image-file.type';

const imageUploadInterceptor = FilesInterceptor('images', 10, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Only image uploads are allowed'), false);
      return;
    }

    callback(null, true);
  },
});

@Controller('cottages')
export class CottageController {
  constructor(private readonly cottageService: CottageService) {}

  @Get()
  findAll() {
    return this.cottageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cottageService.findOne(id);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post()
  @UseInterceptors(imageUploadInterceptor)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(
    @Body() createCottageDto: CreateCottageDto,
    @UploadedFiles() files: UploadedImageFile[] = [],
  ) {
    return this.cottageService.create(createCottageDto, files);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(imageUploadInterceptor)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCottageDto: UpdateCottageDto,
    @UploadedFiles() files: UploadedImageFile[] = [],
  ) {
    return this.cottageService.update(id, updateCottageDto, files);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cottageService.remove(id);
  }
}

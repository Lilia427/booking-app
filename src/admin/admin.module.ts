import { Module } from '@nestjs/common';
import { UserService } from './admin.service';
import { UserController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from './entities/admin.entity';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity])],
  controllers: [UserController],
  providers: [UserService, AdminJwtAuthGuard, TokenBlacklistService],
})
export class AdminModule {}

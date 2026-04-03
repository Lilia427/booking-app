import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UserService } from './admin.service';
import { UserProfileResponse, UserResponse } from './types/userResponse';
import { LoginAdminDto } from './dto/LoginAdminDto';
import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@Controller('admin')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createAdminDto: CreateAdminDto): Promise<UserResponse> {
    // return this.userService.create(createUserDto);
    const user = await this.userService.create(createAdminDto);
    return this.userService.buildUserResponse(user);

  }

  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginAdminDto): Promise<UserResponse> {
    // Тут можна додати логіку аутентифікації користувача
    // Наприклад, перевірити email та пароль, і якщо вони правильні, повернути токен
    const user = await this.userService.login(loginDto.email, loginDto.password);
    return this.userService.buildUserResponse(user);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post('logout')
  logout(@Req() req: Request & { authToken?: string }) {
    if (!req.authToken) {
      throw new UnauthorizedException('Authorization token is missing');
    }

    return this.userService.logout(req.authToken);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request): Promise<UserProfileResponse> {
    const authUser = (req as Request & { user?: JwtPayload }).user;

    if (!authUser || typeof authUser.id !== 'number') {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.userService.getById(authUser.id);
    return this.userService.buildUserProfileResponse(user);
  }


  @Get()
  findAll() {
    return this.userService.findAll();
  }
}

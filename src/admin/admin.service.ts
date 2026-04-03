import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminEntity } from './entities/admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { UserProfile, UserProfileResponse, UserResponse } from './types/userResponse';
import { compare } from 'bcrypt';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class UserService {

  constructor(@InjectRepository(AdminEntity)
  private readonly userRepository: Repository<AdminEntity>,
  private readonly tokenBlacklistService: TokenBlacklistService,
  ) { }

  async create(createAdminDto: CreateAdminDto): Promise<UserProfile> {
    const existingUserByEmail = await this.userRepository.findOne({ where: { email: createAdminDto.email } });
    const existingUserByName = await this.userRepository.findOne({ where: { name: createAdminDto.name } });

    if (existingUserByEmail) {
      throw new BadRequestException('Email is already in use');
    }

    if (existingUserByName) {
      throw new BadRequestException('Name is already in use');
    }
    const newUser = new AdminEntity();
    Object.assign(newUser, createAdminDto);

    // Тут можна додати логіку збереження користувача в базі даних
    const savedUser = await this.userRepository.save(newUser);

    return this.toUserProfile(savedUser);
  }

  async login(email: string, password: string): Promise<UserProfile> {
    const user = await this.userRepository.findOne({ where: { email }, select: ['id', 'email', 'name', 'password'] });

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async getById(id: number): Promise<UserProfile> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.toUserProfile(user);
  }

  logout(token: string) {
    this.tokenBlacklistService.revoke(token);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  findAll() {
    const users = this.userRepository.find();
    return users;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }

  buildUserResponse(user: UserProfile): UserResponse {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      }
      // Додайте інші поля, які хочете повернути у відповіді
    };
  }

  buildUserProfileResponse(user: UserProfile): UserProfileResponse {
    return {
      user,
    };
  }

  generateJwt(user: UserProfile): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    return sign(
      {
      id: user.id,
      email: user.email,
      name: user.name,
      },
      secret,
      // { expiresIn: '1h' }, 
    );
  }

  private toUserProfile(user: Pick<AdminEntity, 'id' | 'email' | 'name'>): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}

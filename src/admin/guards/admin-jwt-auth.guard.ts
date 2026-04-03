import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Request } from 'express';
import { TokenBlacklistService } from '../token-blacklist.service';

type AuthenticatedRequest = Request & { user?: JwtPayload; authToken?: string };

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format. Use Bearer token');
    }

    if (this.tokenBlacklistService.isRevoked(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    try {
      const payload = verify(token, secret);

      if (typeof payload === 'string' || typeof payload.id !== 'number') {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = payload;
      request.authToken = token;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

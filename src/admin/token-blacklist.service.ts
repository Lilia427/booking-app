import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly revokedTokens = new Set<string>();

  revoke(token: string): void {
    this.revokedTokens.add(token);
  }

  isRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }
}

import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

export interface JWTPayload {
  sub: string; // wallet address
  roles: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthSession {
  walletAddress: string;
  roles: string[];
  sessionId: string;
  expiresAt: Date;
}

class JWTAuthService {
  private secret: Uint8Array;

  constructor() {
    const secretKey = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    this.secret = new TextEncoder().encode(secretKey);
  }

  async createToken(walletAddress: string, roles: string[]): Promise<string> {
    const sessionId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 60 * 60); // 24 hours

    return await new SignJWT({
      sub: walletAddress,
      roles,
      sessionId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(this.secret);
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      return payload as unknown as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  async refreshToken(token: string): Promise<string | null> {
    const payload = await this.verifyToken(token);
    if (!payload) return null;

    // Check if token expires within 1 hour
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp - now > 3600) return token; // Still valid for >1 hour

    return await this.createToken(payload.sub, payload.roles);
  }

  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;
    if (!authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}

export const jwtAuth = new JWTAuthService();
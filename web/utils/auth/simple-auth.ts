'use client';

import { Role } from '../../app/auth/roles';

export interface SimpleUser {
  email: string;
  walletAddress: string;
  roles: Role[];
}

export interface AuthSession {
  wallet: string;
  roles: Role[];
  email?: string;
  expires: string;
}

// Generate deterministic wallet address from email
export function generateWalletFromEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${'0'.repeat(32)}`;
}

export function createUserFromEmail(email: string): SimpleUser {
  const walletAddress = generateWalletFromEmail(email);
  
  // Assign default roles based on email or wallet
  let roles: Role[] = [Role.VIEWER];
  
  // Check if super admin
  const superAdminWallet = '0x860Ec697167Ba865DdE1eC9e172004100613e970';
  if (walletAddress.toLowerCase() === superAdminWallet.toLowerCase()) {
    roles = [Role.SUPER_ADMIN, Role.ADMIN, Role.CURATOR, Role.ANIMATOR, Role.SPONSOR];
  }
  
  return {
    email,
    walletAddress,
    roles
  };
}

// Session management
export function createSession(user: SimpleUser): AuthSession {
  return {
    wallet: user.walletAddress,
    roles: user.roles,
    email: user.email,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
}

export function saveSession(session: AuthSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mv-auth-session', JSON.stringify(session));
    // Also set cookie for middleware - base64 encoded
    document.cookie = `rbac-session=${btoa(JSON.stringify(session))}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function getSession(): AuthSession | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('mv-auth-session');
    if (stored) {
      const session = JSON.parse(stored);
      if (new Date(session.expires) > new Date()) {
        return session;
      }
      clearSession();
    }
  }
  return null;
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mv-auth-session');
    document.cookie = 'rbac-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

// Super Admin direct access
export function createSuperAdminSession(): AuthSession {
  return {
    wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970',
    roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CURATOR, Role.ANIMATOR, Role.SPONSOR],
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}
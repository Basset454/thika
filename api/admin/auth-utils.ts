import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Server-side Admin Authentication Utilities for Trust Furniture (أثاث الثقة).
 * 
 * Security properties:
 * 1. Fails closed: If ADMIN_PASSWORD is unset and no local secret file exists, all logins are rejected.
 * 2. Constant-time password comparison to prevent timing attacks.
 * 3. HMAC-SHA256 signed stateless tokens with expiration timestamps,
 *    enabling verified sessions across serverless instances without shared database state.
 * 4. Supports dynamic password regeneration and custom secret persistence.
 */

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_PREFIX = 'trust_sess_';

export function getCustomPasswordFilePath(): string {
  return path.resolve(process.cwd(), '.admin_password');
}

export function setCustomAdminPassword(newPassword: string): boolean {
  try {
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return false;
    }
    const targetPath = getCustomPasswordFilePath();
    fs.writeFileSync(targetPath, newPassword.trim(), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save admin password:', err);
    return false;
  }
}

export function getAuthSecret(): string | null {
  // 1. Priority: custom generated or saved admin password file (.admin_password)
  try {
    const customPath = getCustomPasswordFilePath();
    if (fs.existsSync(customPath)) {
      const content = fs.readFileSync(customPath, 'utf8').trim();
      if (content.length > 0) return content;
    }
  } catch {
    // ignore
  }

  // 2. Fallback: process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !secret.trim()) return null;
  return secret.trim();
}

export function isAuthConfigured(): boolean {
  const secret = getAuthSecret();
  return Boolean(secret && secret.trim().length > 0);
}

/**
 * Constant-time comparison helper.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Constant-time password verification using SHA-256 digests.
 * Accepts either the freshly generated/custom password or the environment password.
 */
export function verifyAdminPassword(inputPassword: string): boolean {
  if (!inputPassword || typeof inputPassword !== 'string') return false;

  const currentSecret = getAuthSecret();
  if (currentSecret && constantTimeCompare(inputPassword, currentSecret)) {
    return true;
  }

  // Also support the original environment password if distinct
  const envSecret = process.env.ADMIN_PASSWORD?.trim();
  if (envSecret && envSecret !== currentSecret && constantTimeCompare(inputPassword, envSecret)) {
    return true;
  }

  return false;
}

/**
 * Generates an HMAC-SHA256 signed session token.
 */
export function createSessionToken(): string | null {
  const secret = getAuthSecret();
  if (!secret) return null;

  const payload = {
    exp: Date.now() + SESSION_TTL_MS,
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return `${TOKEN_PREFIX}${payloadBase64}.${signature}`;
}

/**
 * Cryptographically verifies an HMAC-SHA256 session token.
 */
export function verifySessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  if (!token.startsWith(TOKEN_PREFIX)) return false;

  const raw = token.slice(TOKEN_PREFIX.length);
  const parts = raw.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;
  if (!payloadBase64 || !signature) return false;

  // Candidate secrets to verify against
  const secrets: string[] = [];
  const currentSecret = getAuthSecret();
  if (currentSecret) secrets.push(currentSecret);
  const envSecret = process.env.ADMIN_PASSWORD?.trim();
  if (envSecret && !secrets.includes(envSecret)) secrets.push(envSecret);

  if (secrets.length === 0) return false;

  let isValidSig = false;
  for (const s of secrets) {
    const expectedSignature = crypto
      .createHmac('sha256', s)
      .update(payloadBase64)
      .digest('base64url');

    if (
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      isValidSig = true;
      break;
    }
  }

  if (!isValidSig) return false;

  // Verify expiration
  try {
    const payloadString = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadString);
    if (!payload.exp || typeof payload.exp !== 'number') return false;
    if (Date.now() > payload.exp) return false; // Expired
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts session token from request (Bearer header, custom header, or Cookie).
 */
export function extractTokenFromRequest(req: any): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = req?.headers?.authorization || req?.headers?.['authorization'] || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. Custom header x-admin-token
  const customHeader = req?.headers?.['x-admin-token'] || req?.headers?.get?.('x-admin-token');
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }

  // 3. Cookie: trust_admin_session=<token>
  const cookieHeader = req?.headers?.cookie || req?.headers?.['cookie'] || '';
  if (typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/trust_admin_session=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return null;
}

/**
 * Server authorization check for API handlers.
 */
export function checkAdminAuth(req: any): boolean {
  const token = extractTokenFromRequest(req);
  return verifySessionToken(token);
}

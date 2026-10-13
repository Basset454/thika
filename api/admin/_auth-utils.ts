import crypto from 'crypto';

/**
 * Server-side Admin Authentication Utilities for Trust Furniture (أثاث الثقة).
 * 
 * Security properties:
 * 1. Fails closed: If ADMIN_PASSWORD is unset or empty, all login attempts are rejected.
 * 2. Constant-time password comparison to prevent timing attacks.
 * 3. HMAC-SHA256 signed stateless tokens with expiration timestamps,
 *    enabling verified sessions across serverless instances without shared database state.
 * 4. Never exposes or logs secrets.
 */

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_PREFIX = 'trust_sess_';

export function isAuthConfigured(): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  return Boolean(secret && secret.trim().length > 0);
}

function getAuthSecret(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !secret.trim()) return null;
  return secret.trim();
}

/**
 * Constant-time password verification using SHA-256 digests.
 */
export function verifyAdminPassword(inputPassword: string): boolean {
  const configuredPassword = getAuthSecret();
  if (!configuredPassword || !inputPassword) return false;

  const expectedHash = crypto.createHash('sha256').update(configuredPassword).digest();
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest();

  return crypto.timingSafeEqual(expectedHash, inputHash);
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

  const secret = getAuthSecret();
  if (!secret) return false;

  const raw = token.slice(TOKEN_PREFIX.length);
  const parts = raw.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;
  if (!payloadBase64 || !signature) return false;

  // Verify HMAC signature in constant time
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  if (signature.length !== expectedSignature.length) return false;
  const sigMatch = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!sigMatch) return false;

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

export function setCustomAdminPassword(newPassword: string): boolean {
  process.env.ADMIN_PASSWORD = newPassword;
  return true;
}

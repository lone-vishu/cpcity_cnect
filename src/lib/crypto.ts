/**
 * Capacity Connect - Demo Cryptographic Helpers
 *
 * NOTE ON SECURITY:
 * This uses Web Crypto API SHA-256 with a salt purely for prototype demonstration.
 * In a real production deployment for the Ministry of Earth Sciences / IMD:
 * - A slow, memory-hard password hashing algorithm (Argon2id or bcrypt) must be used server-side.
 * - Rate limiting, account lockout policies, and CSRF protection must be enforced.
 * - Multi-Factor Authentication (NIC Jan Parichay SSO / TOTP) must be implemented.
 */

const DEMO_SALT = 'capacity_connect_prototype_salt_2026';

export async function hashPassword(password: string, salt: string = DEMO_SALT): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(
  plainText: string,
  storedHash: string,
  salt: string = DEMO_SALT
): Promise<boolean> {
  const computed = await hashPassword(plainText, salt);
  return computed === storedHash;
}

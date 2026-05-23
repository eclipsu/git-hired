import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([encrypted, authTag]).toString('hex');
  return `${iv.toString('hex')}:${payload}`;
}

export function decrypt(stored: string): string {
  const [ivHex, payloadHex] = stored.split(':');
  if (!ivHex || !payloadHex) {
    throw new Error('Invalid encrypted payload');
  }

  const payload = Buffer.from(payloadHex, 'hex');
  const authTag = payload.subarray(payload.length - AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(0, payload.length - AUTH_TAG_LENGTH);
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

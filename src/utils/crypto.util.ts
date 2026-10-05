import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// The key must be exactly 32 bytes (256 bits).
const getEncryptionKey = (): string => {
  const envKey = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: INTEGRATION_ENCRYPTION_KEY is not set in production.');
    }
    // Fallback for local development only
    console.warn('WARNING: Using default insecure encryption key. Set INTEGRATION_ENCRYPTION_KEY in .env');
    return 'default-insecure-secret-key-that-is-32bytes!'.slice(0, 32);
  }
  
  if (envKey.length < 32) {
    return envKey.padEnd(32, '0');
  }
  return envKey.slice(0, 32);
};

export const encryptSecret = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, 100000, KEY_LENGTH, 'sha512');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:salt:tag:encryptedData
  return `${iv.toString('hex')}:${salt.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

export const decryptSecret = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted text format');
  
  const iv = Buffer.from(parts[0]!, 'hex');
  const salt = Buffer.from(parts[1]!, 'hex');
  const tag = Buffer.from(parts[2]!, 'hex');
  const encryptedData = parts[3]!;
  
  const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, 100000, KEY_LENGTH, 'sha512');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

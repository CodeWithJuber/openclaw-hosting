import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

const ALGORITHM = 'aes-256-gcm';

// Key storage interface
interface KeyStorage {
  getDataKey(): Promise<Buffer>;
}

// AWS KMS implementation
class AWSKMSStorage implements KeyStorage {
  private client: KMSClient;
  private keyId: string;
  
  constructor(region: string, keyId: string) {
    this.client = new KMSClient({ region });
    this.keyId = keyId;
  }
  
  async getDataKey(): Promise<Buffer> {
    // Generate data key from KMS
    const command = new GenerateDataKeyCommand({
      KeyId: this.keyId,
      KeySpec: 'AES_256'
    });
    
    const response = await this.client.send(command);
    return response.Plaintext as Buffer;
  }
  
  async encrypt(dataKey: Buffer): Promise<Buffer> {
    const command = new EncryptCommand({
      KeyId: this.keyId,
      Plaintext: dataKey
    });
    
    const response = await this.client.send(command);
    return response.CiphertextBlob as Buffer;
  }
}

// Environment variable fallback (for development)
class EnvKeyStorage implements KeyStorage {
  async getDataKey(): Promise<Buffer> {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY not set');
    }
    return scryptSync(key, 'salt', 32);
  }
}

// AES-256-GCM Encryption Service
class EncryptionService {
  private keyStorage: KeyStorage;
  
  constructor(keyStorage: KeyStorage) {
    this.keyStorage = keyStorage;
  }
  
  async encrypt(plaintext: string): Promise<string> {
    const key = await this.keyStorage.getDataKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Format: iv:tag:ciphertext (all hex encoded)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }
  
  async decrypt(ciphertext: string): Promise<string> {
    const key = await this.keyStorage.getDataKey();
    
    const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !encryptedHex) {
      throw new Error('Invalid ciphertext format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }
}

// API Key encryption helper
class APIKeyEncryption {
  private encryption: EncryptionService;
  
  constructor(encryption: EncryptionService) {
    this.encryption = encryption;
  }
  
  async encryptAPIKey(apiKey: string): Promise<string> {
    // Validate API key format
    if (!this.isValidAPIKey(apiKey)) {
      throw new Error('Invalid API key format');
    }
    
    return await this.encryption.encrypt(apiKey);
  }
  
  async decryptAPIKey(encryptedKey: string): Promise<string> {
    return await this.encryption.decrypt(encryptedKey);
  }
  
  private isValidAPIKey(key: string): boolean {
    // Basic validation for common API key formats
    const patterns = [
      /^sk-[a-zA-Z0-9]{48,}$/, // OpenAI, Anthropic
      /^[A-Za-z0-9-_]{32,}$/,  // Generic
    ];
    
    return patterns.some(p => p.test(key));
  }
  
  // Mask API key for display (show only first/last 4 chars)
  static maskAPIKey(key: string): string {
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
}

export {
  EncryptionService,
  APIKeyEncryption,
  AWSKMSStorage,
  EnvKeyStorage,
  KeyStorage
};

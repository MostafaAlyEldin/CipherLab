// Web Crypto API Utilities

// Buffer to Hex
export function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hex to Buffer
export function hexToBuf(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

// Buffer to Base64
export function bufToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Base64 to Buffer
export function base64ToBuf(base64: string): Uint8Array {
  const binary = window.atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert buffer to binary bit string '0101...'
export function bufToBits(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bits = '';
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }
  return bits;
}

// PBKDF2 Key Derivation
async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// 1. AES-256-GCM Text Encryption
export interface AesEncryptedPackage {
  ciphertext: string; // Base64
  saltHex: string;
  ivHex: string;
  tagHex: string;
  derivedKeyHex: string;
}

export async function encryptAesGcm(text: string, password: string): Promise<AesEncryptedPackage> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);

  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  const derivedKeyHex = bufToHex(exportedKey);

  const encodedData = enc.encode(text);
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encodedData
  );

  // In AES-GCM, the last 16 bytes of the encrypted buffer is the authentication tag
  const encryptedBytes = new Uint8Array(encryptedBuf);
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

  return {
    ciphertext: bufToBase64(encryptedBuf),
    saltHex: bufToHex(salt.buffer as ArrayBuffer),
    ivHex: bufToHex(iv.buffer as ArrayBuffer),
    tagHex: bufToHex(tagBytes.buffer as ArrayBuffer),
    derivedKeyHex,
  };
}

export async function decryptAesGcm(pkg: { ciphertext: string; saltHex: string; ivHex: string }, password: string): Promise<string> {
  const salt = hexToBuf(pkg.saltHex);
  const iv = hexToBuf(pkg.ivHex);
  const key = await deriveAesKey(password, salt);
  const encryptedBytes = base64ToBuf(pkg.ciphertext);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encryptedBytes as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
}

// 2. AES-256-GCM File Encryption
export async function encryptFileAes(file: File, password: string): Promise<{ blob: Blob; saltHex: string; ivHex: string }> {
  const fileBuffer = await file.arrayBuffer();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);

  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    fileBuffer
  );

  // Combine: 16 bytes Salt + 12 bytes IV + encrypted data
  const combined = new Uint8Array(16 + 12 + encryptedBuf.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(encryptedBuf), 28);

  const blob = new Blob([combined], { type: 'application/octet-stream' });
  return {
    blob,
    saltHex: bufToHex(salt.buffer as ArrayBuffer),
    ivHex: bufToHex(iv.buffer as ArrayBuffer),
  };
}

export async function decryptFileAes(file: File, password: string): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  if (buffer.byteLength < 28) {
    throw new Error('Invalid encrypted file format (file too small).');
  }

  const salt = new Uint8Array(buffer.slice(0, 16));
  const iv = new Uint8Array(buffer.slice(16, 28));
  const ciphertext = buffer.slice(28);

  const key = await deriveAesKey(password, salt);
  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext
  );

  return new Blob([decryptedBuf]);
}

// 3. RSA-OAEP 2048 Key Generation & Encryption
export interface RsaKeyPairPem {
  publicKeyPem: string;
  privateKeyPem: string;
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export async function generateRsaKeyPair(): Promise<RsaKeyPairPem> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const pubB64 = bufToBase64(spki).match(/.{1,64}/g)?.join('\n') || '';
  const privB64 = bufToBase64(pkcs8).match(/.{1,64}/g)?.join('\n') || '';

  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${pubB64}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privB64}\n-----END PRIVATE KEY-----`;

  return {
    publicKeyPem,
    privateKeyPem,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

export async function rsaEncrypt(text: string, publicKey: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    enc.encode(text)
  );
  return bufToBase64(encrypted);
}

export async function rsaDecrypt(ciphertextB64: string, privateKey: CryptoKey): Promise<string> {
  const dec = new TextDecoder();
  const buffer = base64ToBuf(ciphertextB64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    buffer as unknown as BufferSource
  );
  return dec.decode(decrypted);
}

// 4. Digital Signatures (RSASSA-PKCS1-v1_5)
export async function generateSignatureKeys(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
}

export async function signMessage(message: string, privateKey: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const signature = await window.crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    enc.encode(message)
  );
  return bufToBase64(signature);
}

export async function verifySignature(message: string, signatureB64: string, publicKey: CryptoKey): Promise<boolean> {
  const enc = new TextEncoder();
  const sigBuf = base64ToBuf(signatureB64);
  return await window.crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    sigBuf as unknown as BufferSource,
    enc.encode(message)
  );
}

// 5. Cryptographic Hashing
export async function computeHash(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512', data: ArrayBuffer | string): Promise<{ hex: string; bits: string }> {
  let buffer: BufferSource;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else {
    buffer = data;
  }
  const digest = await window.crypto.subtle.digest(algorithm, buffer);
  return {
    hex: bufToHex(digest),
    bits: bufToBits(digest),
  };
}

// Avalanche Effect Difference
export function calculateBitDifference(bitsA: string, bitsB: string): {
  diffCount: number;
  totalBits: number;
  percentage: number;
  diffIndices: Set<number>;
} {
  const maxLen = Math.max(bitsA.length, bitsB.length);
  const diffIndices = new Set<number>();
  let diffCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const bitA = bitsA[i] || '0';
    const bitB = bitsB[i] || '0';
    if (bitA !== bitB) {
      diffCount++;
      diffIndices.add(i);
    }
  }

  const percentage = (diffCount / (maxLen || 1)) * 100;
  return {
    diffCount,
    totalBits: maxLen,
    percentage: parseFloat(percentage.toFixed(2)),
    diffIndices,
  };
}

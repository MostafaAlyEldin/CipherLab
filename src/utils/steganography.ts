import { encryptAesGcm, decryptAesGcm } from './webCrypto';

// Helper: Embed payload into ImageData LSB
export interface StegoResult {
  dataUrl: string;
  capacityChars: number;
  usedBytes: number;
}

export function calculateImageCapacity(width: number, height: number): number {
  // 3 channels (RGB) per pixel. Alpha is preserved.
  // 32 bits for length header + 8 bits flag = 40 bits overhead
  const totalUsableBits = width * height * 3;
  const netBits = Math.max(0, totalUsableBits - 40);
  return Math.floor(netBits / 8);
}

// Convert byte to 8 bits
function byteToBits(byte: number): number[] {
  const bits: number[] = [];
  for (let i = 7; i >= 0; i--) {
    bits.push((byte >> i) & 1);
  }
  return bits;
}

// Convert 8 bits to byte
function bitsToByte(bits: number[]): number {
  let byte = 0;
  for (let i = 0; i < 8; i++) {
    byte = (byte << 1) | bits[i];
  }
  return byte;
}

export async function embedMessageInCanvas(
  sourceCanvas: HTMLCanvasElement,
  message: string,
  password?: string
): Promise<StegoResult> {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const capacity = calculateImageCapacity(width, height);

  let payloadBytes: Uint8Array;
  let isEncrypted = false;

  if (password && password.trim().length > 0) {
    const encryptedPkg = await encryptAesGcm(message, password);
    const jsonStr = JSON.stringify(encryptedPkg);
    payloadBytes = new TextEncoder().encode(jsonStr);
    isEncrypted = true;
  } else {
    payloadBytes = new TextEncoder().encode(message);
  }

  if (payloadBytes.length > capacity) {
    throw new Error(`Message payload (${payloadBytes.length} bytes) exceeds image capacity (${capacity} bytes). Use a larger image or shorter message.`);
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Header: 32 bits for payload length, 8 bits for flags (bit 0 = isEncrypted)
  const headerBits: number[] = [];
  const len = payloadBytes.length;

  for (let i = 31; i >= 0; i--) {
    headerBits.push((len >> i) & 1);
  }
  const flagByte = isEncrypted ? 1 : 0;
  for (let i = 7; i >= 0; i--) {
    headerBits.push((flagByte >> i) & 1);
  }

  // Payload bits
  const payloadBits: number[] = [];
  for (let i = 0; i < payloadBytes.length; i++) {
    payloadBits.push(...byteToBits(payloadBytes[i]));
  }

  const allBits = [...headerBits, ...payloadBits];

  let bitIdx = 0;
  for (let i = 0; i < data.length && bitIdx < allBits.length; i++) {
    // Skip Alpha channel (every 4th byte: 3, 7, 11...)
    if ((i + 1) % 4 === 0) continue;

    // Clear LSB and write payload bit
    data[i] = (data[i] & 0xfe) | allBits[bitIdx];
    bitIdx++;
  }

  ctx.putImageData(imgData, 0, 0);
  const dataUrl = sourceCanvas.toDataURL('image/png');

  return {
    dataUrl,
    capacityChars: capacity,
    usedBytes: payloadBytes.length,
  };
}

export async function extractMessageFromCanvas(
  canvas: HTMLCanvasElement,
  password?: string
): Promise<{ message: string; isEncrypted: boolean }> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Extract first 40 bits (32 for length, 8 for flags)
  const headerBits: number[] = [];
  let byteIndex = 0;

  while (headerBits.length < 40 && byteIndex < data.length) {
    if ((byteIndex + 1) % 4 !== 0) {
      headerBits.push(data[byteIndex] & 1);
    }
    byteIndex++;
  }

  if (headerBits.length < 40) {
    throw new Error('Image too small or no data embedded.');
  }

  // Parse length (32 bits)
  let payloadLength = 0;
  for (let i = 0; i < 32; i++) {
    payloadLength = (payloadLength << 1) | headerBits[i];
  }

  // Parse flag (8 bits)
  let flag = 0;
  for (let i = 32; i < 40; i++) {
    flag = (flag << 1) | headerBits[i];
  }
  const isEncrypted = (flag & 1) === 1;

  const maxCapacity = calculateImageCapacity(canvas.width, canvas.height);
  if (payloadLength <= 0 || payloadLength > maxCapacity) {
    throw new Error('No valid hidden message detected or corrupted payload header.');
  }

  // Extract payload bits
  const totalPayloadBits = payloadLength * 8;
  const payloadBits: number[] = [];

  while (payloadBits.length < totalPayloadBits && byteIndex < data.length) {
    if ((byteIndex + 1) % 4 !== 0) {
      payloadBits.push(data[byteIndex] & 1);
    }
    byteIndex++;
  }

  if (payloadBits.length < totalPayloadBits) {
    throw new Error('Image data ended unexpectedly before message could be completely extracted.');
  }

  const payloadBytes = new Uint8Array(payloadLength);
  for (let i = 0; i < payloadLength; i++) {
    const chunk = payloadBits.slice(i * 8, i * 8 + 8);
    payloadBytes[i] = bitsToByte(chunk);
  }

  if (isEncrypted) {
    if (!password) {
      return {
        message: 'LOCKED: This message is password-encrypted with AES-256-GCM. Please enter the decryption password.',
        isEncrypted: true,
      };
    }

    try {
      const jsonStr = new TextDecoder().decode(payloadBytes);
      const pkg = JSON.parse(jsonStr);
      const decrypted = await decryptAesGcm(pkg, password);
      return { message: decrypted, isEncrypted: true };
    } catch {
      throw new Error('Incorrect password or corrupted ciphertext payload.');
    }
  }

  const rawMessage = new TextDecoder().decode(payloadBytes);
  return { message: rawMessage, isEncrypted: false };
}

// Generate difference visualization canvas
export function generateVisualDifference(
  originalData: ImageData,
  stegoData: ImageData,
  diffCanvas: HTMLCanvasElement
) {
  const ctx = diffCanvas.getContext('2d');
  if (!ctx) return;

  const width = originalData.width;
  const height = originalData.height;
  diffCanvas.width = width;
  diffCanvas.height = height;

  const diffImg = ctx.createImageData(width, height);
  const orig = originalData.data;
  const stego = stegoData.data;
  const diff = diffImg.data;

  for (let i = 0; i < orig.length; i += 4) {
    const rDiff = Math.abs(orig[i] - stego[i]);
    const gDiff = Math.abs(orig[i + 1] - stego[i + 1]);
    const bDiff = Math.abs(orig[i + 2] - stego[i + 2]);

    if (rDiff > 0 || gDiff > 0 || bDiff > 0) {
      // Amplify difference with bright neon cyan/green pixel for visual inspection
      diff[i] = 0;        // R
      diff[i + 1] = 255;  // G
      diff[i + 2] = 230;  // B
      diff[i + 3] = 255;  // Alpha
    } else {
      // Dark gray background
      diff[i] = 12;
      diff[i + 1] = 16;
      diff[i + 2] = 24;
      diff[i + 3] = 255;
    }
  }

  ctx.putImageData(diffImg, 0, 0);
}

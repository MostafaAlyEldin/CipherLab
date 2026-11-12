import { ClassicalCipherResult, ClassicalStep } from '../types/crypto';

// Helpers
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function modInverse(a: number, m: number): number | null {
  const cleanA = mod(a, m);
  for (let x = 1; x < m; x++) {
    if ((cleanA * x) % m === 1) return x;
  }
  return null;
}

// 1. Caesar Cipher
export function processCaesar(text: string, shift: number, decrypt = false): ClassicalCipherResult {
  const effectiveShift = decrypt ? mod(-shift, 26) : mod(shift, 26);
  const steps: ClassicalStep[] = [];
  let output = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';

    if (isUpper || isLower) {
      const base = isUpper ? 65 : 97;
      const originalCode = ch.charCodeAt(0) - base;
      const newCode = mod(originalCode + effectiveShift, 26);
      const resChar = String.fromCharCode(base + newCode);
      output += resChar;

      steps.push({
        stepIndex: i,
        inputChar: ch,
        outputChar: resChar,
        explanation: `${ch} (${originalCode}) ${decrypt ? '-' : '+'} ${Math.abs(shift)} = ${resChar} (${newCode})`,
      });
    } else {
      output += ch;
      steps.push({
        stepIndex: i,
        inputChar: ch,
        outputChar: ch,
        explanation: `Non-alphabetic character preserved`,
      });
    }
  }

  return { output, steps };
}

// 2. Vigenère Cipher
export function processVigenere(text: string, key: string, decrypt = false): ClassicalCipherResult {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '') || 'KEY';
  const steps: ClassicalStep[] = [];
  let output = '';
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';

    if (isUpper || isLower) {
      const base = isUpper ? 65 : 97;
      const textCode = ch.charCodeAt(0) - base;
      const keyChar = cleanKey[keyIndex % cleanKey.length];
      const keyCode = keyChar.charCodeAt(0) - 65;
      const effectiveShift = decrypt ? mod(-keyCode, 26) : keyCode;
      const resCode = mod(textCode + effectiveShift, 26);
      const resChar = String.fromCharCode(base + resCode);
      output += resChar;

      steps.push({
        stepIndex: i,
        inputChar: ch,
        outputChar: resChar,
        explanation: `Key char '${keyChar}' (shift ${keyCode}): ${ch} (${textCode}) ${decrypt ? '-' : '+'} ${keyCode} mod 26 = ${resChar} (${resCode})`,
      });
      keyIndex++;
    } else {
      output += ch;
      steps.push({
        stepIndex: i,
        inputChar: ch,
        outputChar: ch,
        explanation: `Punctuation/space preserved`,
      });
    }
  }

  return { output, steps };
}

// 3. Playfair Cipher
export function buildPlayfairGrid(key: string): string[][] {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const seen = new Set<string>();
  const order: string[] = [];

  for (const c of cleanKey) {
    if (!seen.has(c)) {
      seen.add(c);
      order.push(c);
    }
  }

  for (let i = 65; i <= 90; i++) {
    const ch = String.fromCharCode(i);
    if (ch === 'J') continue;
    if (!seen.has(ch)) {
      seen.add(ch);
      order.push(ch);
    }
  }

  const grid: string[][] = [];
  for (let r = 0; r < 5; r++) {
    grid.push(order.slice(r * 5, r * 5 + 5));
  }
  return grid;
}

export function processPlayfair(text: string, key: string, decrypt = false): ClassicalCipherResult {
  const grid = buildPlayfairGrid(key);
  const posMap = new Map<string, [number, number]>();

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      posMap.set(grid[r][c], [r, c]);
    }
  }

  // Preprocess text into digraphs
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const digraphs: [string, string][] = [];
  let idx = 0;

  while (idx < clean.length) {
    const first = clean[idx];
    if (idx + 1 === clean.length) {
      digraphs.push([first, 'X']);
      idx += 1;
    } else {
      const second = clean[idx + 1];
      if (first === second && !decrypt) {
        digraphs.push([first, 'X']);
        idx += 1;
      } else {
        digraphs.push([first, second]);
        idx += 2;
      }
    }
  }

  const steps: ClassicalStep[] = [];
  let output = '';

  digraphs.forEach(([c1, c2], i) => {
    const [r1, col1] = posMap.get(c1) || [0, 0];
    const [r2, col2] = posMap.get(c2) || [0, 0];

    let o1 = '';
    let o2 = '';
    let reason = '';

    if (r1 === r2) {
      // Same row
      const shift = decrypt ? -1 : 1;
      const ncol1 = mod(col1 + shift, 5);
      const ncol2 = mod(col2 + shift, 5);
      o1 = grid[r1][ncol1];
      o2 = grid[r2][ncol2];
      reason = `Same Row rule (row ${r1}): shift ${decrypt ? 'left' : 'right'}`;
    } else if (col1 === col2) {
      // Same column
      const shift = decrypt ? -1 : 1;
      const nr1 = mod(r1 + shift, 5);
      const nr2 = mod(r2 + shift, 5);
      o1 = grid[nr1][col1];
      o2 = grid[nr2][col2];
      reason = `Same Column rule (col ${col1}): shift ${decrypt ? 'up' : 'down'}`;
    } else {
      // Rectangle rule
      o1 = grid[r1][col2];
      o2 = grid[r2][col1];
      reason = `Rectangle rule: swap column intersections (${r1},${col1}) & (${r2},${col2}) -> (${r1},${col2}) & (${r2},${col1})`;
    }

    output += o1 + o2;
    steps.push({
      stepIndex: i,
      inputChar: `${c1}${c2}`,
      outputChar: `${o1}${o2}`,
      explanation: `Digraph [${c1}, ${c2}] -> [${o1}, ${o2}]. ${reason}`,
      highlightCoordinates: [r1, col1],
    });
  });

  return {
    output,
    steps,
    auxiliaryData: { playfairGrid: grid },
  };
}

// 4. Hill Cipher (General n x n for n = 2, 3, 4)
export function determinant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  let det = 0;
  for (let j = 0; j < n; j++) {
    const sub = matrix.slice(1).map((row) => row.filter((_, colIndex) => colIndex !== j));
    const sign = j % 2 === 0 ? 1 : -1;
    det += sign * matrix[0][j] * determinant(sub);
  }
  return det;
}

export function invertMatrixMod26(matrix: number[][]): number[][] {
  const n = matrix.length;
  const rawDet = determinant(matrix);
  const det = mod(rawDet, 26);
  const invDet = modInverse(det, 26);
  if (invDet === null) {
    throw new Error(`Determinant ${det} shares a factor with 26, so this matrix has no inverse`);
  }

  if (n === 1) {
    return [[mod(invDet, 26)]];
  }

  // Calculate cofactor matrix and transpose to get adjugate
  const adjugate: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const sub = matrix
        .filter((_, rowIdx) => rowIdx !== r)
        .map((row) => row.filter((_, colIdx) => colIdx !== c));
      const subDet = determinant(sub);
      const sign = (r + c) % 2 === 0 ? 1 : -1;
      const cofactor = sign * subDet;
      // Adjugate is the transpose of the cofactor matrix: adj[c][r] = cofactor
      adjugate[c][r] = mod(cofactor, 26);
    }
  }

  // Multiply adjugate by invDet mod 26
  const inverse: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      inverse[r][c] = mod(adjugate[r][c] * invDet, 26);
    }
  }
  return inverse;
}

export function validateHillKey(matrix: number[][]): {
  valid: boolean;
  error?: string;
  invDet?: number;
  det?: number;
} {
  const n = matrix.length;
  if (![2, 3, 4].includes(n)) {
    return { valid: false, error: 'Matrix must be 2x2, 3x3, or 4x4' };
  }
  for (let r = 0; r < n; r++) {
    if (!Array.isArray(matrix[r]) || matrix[r].length !== n) {
      return { valid: false, error: `Matrix must be a square ${n}x${n} grid` };
    }
    for (let c = 0; c < n; c++) {
      if (typeof matrix[r][c] !== 'number' || !Number.isInteger(matrix[r][c])) {
        return { valid: false, error: 'All matrix elements must be valid integers' };
      }
    }
  }

  const rawDet = determinant(matrix);
  const det = mod(rawDet, 26);
  if (gcd(det, 26) !== 1) {
    return {
      valid: false,
      error: `Determinant ${det} shares a factor with 26, so this matrix has no inverse`,
      det,
    };
  }

  const invDet = modInverse(det, 26)!;
  return { valid: true, det, invDet };
}

export function generateRandomValidHillKey(n: number = 2): number[][] {
  const size = Math.max(2, Math.min(4, n));
  for (let attempt = 0; attempt < 5000; attempt++) {
    const candidate: number[][] = [];
    for (let r = 0; r < size; r++) {
      const row: number[] = [];
      for (let c = 0; c < size; c++) {
        row.push(Math.floor(Math.random() * 26));
      }
      candidate.push(row);
    }
    const val = validateHillKey(candidate);
    if (val.valid) return candidate;
  }
  if (size === 2) return [[3, 3], [2, 5]];
  if (size === 3) return [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
  return [
    [1, 2, 3, 4],
    [0, 1, 5, 6],
    [0, 0, 1, 7],
    [0, 0, 0, 1],
  ];
}

export function processHill(text: string, matrix: number[][], decrypt = false): ClassicalCipherResult {
  const validation = validateHillKey(matrix);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid Hill matrix key');
  }

  const n = matrix.length;
  const activeMatrix = decrypt ? invertMatrixMod26(matrix) : matrix;
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length === 0) {
    return {
      output: '',
      steps: [],
      auxiliaryData: {
        hillMatrix: matrix,
        hillInverse: invertMatrixMod26(matrix),
      },
    };
  }

  const remainder = clean.length % n;
  const padCount = remainder === 0 ? 0 : n - remainder;
  const padded = clean + 'X'.repeat(padCount);

  const steps: ClassicalStep[] = [];
  let output = '';

  for (let i = 0; i < padded.length; i += n) {
    const pBlock = padded.slice(i, i + n);
    const pVector: number[] = [];
    for (let j = 0; j < n; j++) {
      pVector.push(pBlock.charCodeAt(j) - 65);
    }

    // Row-vector convention c = p * activeMatrix mod 26
    const cVector: number[] = [];
    let outBlock = '';
    for (let col = 0; col < n; col++) {
      let sum = 0;
      for (let row = 0; row < n; row++) {
        sum += pVector[row] * activeMatrix[row][col];
      }
      const cVal = mod(sum, 26);
      cVector.push(cVal);
      outBlock += String.fromCharCode(65 + cVal);
    }

    output += outBlock;

    const matrixRowsStr = activeMatrix.map((row) => `[${row.join(', ')}]`).join(', ');
    steps.push({
      stepIndex: i / n,
      inputChar: pBlock,
      outputChar: outBlock,
      explanation: `[${pVector.join(', ')}] * [${matrixRowsStr}] = [${cVector.join(', ')}] mod 26 -> ${outBlock}`,
      matrixState: activeMatrix,
    });
  }

  return {
    output,
    steps,
    auxiliaryData: {
      hillMatrix: matrix,
      hillInverse: invertMatrixMod26(matrix),
    },
  };
}

// 5. Rail Fence Cipher
export function processRailFence(text: string, rails: number, decrypt = false): ClassicalCipherResult {
  const numRails = Math.max(2, Math.min(10, Math.floor(rails)));
  const clean = text;
  const len = clean.length;

  if (len === 0) return { output: '', steps: [] };

  const grid: (string | null)[][] = Array.from({ length: numRails }, () =>
    Array(len).fill(null)
  );

  // Track zigzag pattern
  let rail = 0;
  let directionDown = false;
  const railCoords: { rail: number; col: number }[] = [];

  for (let i = 0; i < len; i++) {
    railCoords.push({ rail, col: i });
    if (rail === 0 || rail === numRails - 1) {
      directionDown = !directionDown;
    }
    rail += directionDown ? 1 : -1;
  }

  const steps: ClassicalStep[] = [];
  let output = '';

  if (!decrypt) {
    // Encrypt: place letters along the zigzag
    for (let i = 0; i < len; i++) {
      const { rail: r, col } = railCoords[i];
      grid[r][col] = clean[i];
    }

    // Read row by row
    let outIdx = 0;
    for (let r = 0; r < numRails; r++) {
      for (let c = 0; c < len; c++) {
        if (grid[r][c] !== null) {
          const ch = grid[r][c]!;
          output += ch;
          steps.push({
            stepIndex: outIdx++,
            inputChar: ch,
            outputChar: ch,
            explanation: `Rail ${r + 1}, Column ${c + 1} character '${ch}' added to output sequence`,
          });
        }
      }
    }
  } else {
    // Decrypt: place placeholder '*' along zigzag, fill by rail, read zigzag
    for (let i = 0; i < len; i++) {
      const { rail: r, col } = railCoords[i];
      grid[r][col] = '*';
    }

    let cipherIdx = 0;
    for (let r = 0; r < numRails; r++) {
      for (let c = 0; c < len; c++) {
        if (grid[r][c] === '*' && cipherIdx < len) {
          grid[r][c] = clean[cipherIdx++];
        }
      }
    }

    for (let i = 0; i < len; i++) {
      const { rail: r, col } = railCoords[i];
      const ch = grid[r][col] || '';
      output += ch;
      steps.push({
        stepIndex: i,
        inputChar: ch,
        outputChar: ch,
        explanation: `Step ${i + 1}: Follow zigzag wave to Rail ${r + 1}, Col ${col + 1} -> '${ch}'`,
      });
    }
  }

  return {
    output,
    steps,
    auxiliaryData: { railFenceGrid: grid },
  };
}

// 6. Monoalphabetic Substitution Cipher
export function generateKeyFromPhrase(phrase: string): string {
  const clean = phrase.toUpperCase().replace(/[^A-Z]/g, '');
  const seen = new Set<string>();
  let res = '';
  for (const c of clean) {
    if (!seen.has(c)) {
      seen.add(c);
      res += c;
    }
  }
  for (let i = 65; i <= 90; i++) {
    const c = String.fromCharCode(i);
    if (!seen.has(c)) {
      seen.add(c);
      res += c;
    }
  }
  return res;
}

export function processSubstitution(text: string, keyAlphabet: string, decrypt = false): ClassicalCipherResult {
  const plainAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cipherAlphabet = keyAlphabet.toUpperCase().replace(/[^A-Z]/g, '');
  if (cipherAlphabet.length !== 26) {
    throw new Error('Substitution key must contain all 26 unique alphabetic characters.');
  }

  const map = new Map<string, string>();
  for (let i = 0; i < 26; i++) {
    if (decrypt) {
      map.set(cipherAlphabet[i], plainAlphabet[i]);
    } else {
      map.set(plainAlphabet[i], cipherAlphabet[i]);
    }
  }

  const steps: ClassicalStep[] = [];
  let output = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const upper = ch.toUpperCase();
    if (map.has(upper)) {
      const mapped = map.get(upper)!;
      const resChar = ch === ch.toLowerCase() ? mapped.toLowerCase() : mapped;
      output += resChar;
      steps.push({
        stepIndex: i,
        inputChar: ch,
        outputChar: resChar,
        explanation: `${ch} maps to ${resChar} in substitution alphabet`,
      });
    } else {
      output += ch;
      steps.push({
        stepIndex: i,
        inputChar: ch,
        outputChar: ch,
        explanation: `Preserved symbol`,
      });
    }
  }

  const keyMapObj: Record<string, string> = {};
  for (let i = 0; i < 26; i++) {
    keyMapObj[plainAlphabet[i]] = cipherAlphabet[i];
  }

  return {
    output,
    steps,
    auxiliaryData: { substitutionKey: keyMapObj },
  };
}

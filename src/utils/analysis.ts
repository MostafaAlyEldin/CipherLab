// Cryptanalysis Statistical Utilities

export const ENGLISH_FREQUENCIES: Record<string, number> = {
  E: 12.02, T: 9.10, A: 8.12, O: 7.68, I: 7.31, N: 6.95, S: 6.28,
  R: 6.02, H: 5.92, D: 4.32, L: 3.98, U: 2.88, C: 2.71, M: 2.61,
  F: 2.30, Y: 2.11, W: 2.09, G: 2.03, P: 1.82, B: 1.49, V: 1.11,
  K: 0.69, X: 0.17, Q: 0.11, J: 0.10, Z: 0.07,
};

export const ARABIC_FREQUENCIES: Record<string, number> = {
  'ا': 12.2, 'ل': 11.2, 'م': 7.8, 'ي': 7.3, 'و': 6.8, 'ن': 6.4,
  'ه': 5.1, 'ر': 4.8, 'ب': 4.5, 'ت': 4.2, 'س': 3.5, 'د': 3.1,
  'ع': 3.0, 'ف': 2.7, 'ك': 2.5, 'ق': 2.2, 'ح': 2.1, 'ج': 1.8,
  'ص': 1.6, 'ش': 1.4, 'خ': 1.2, 'ط': 1.1, 'ذ': 0.9, 'ز': 0.8,
  'ث': 0.7, 'ض': 0.6, 'ظ': 0.3, 'غ': 0.3,
};

// Calculate letter counts and percentages
export function calculateLetterFrequencies(text: string): {
  counts: Record<string, number>;
  percentages: Record<string, number>;
  totalLetters: number;
} {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const counts: Record<string, number> = {};
  const percentages: Record<string, number> = {};
  const totalLetters = clean.length;

  for (let i = 65; i <= 90; i++) {
    const ch = String.fromCharCode(i);
    counts[ch] = 0;
    percentages[ch] = 0;
  }

  for (const ch of clean) {
    counts[ch] = (counts[ch] || 0) + 1;
  }

  if (totalLetters > 0) {
    for (const ch of Object.keys(counts)) {
      percentages[ch] = parseFloat(((counts[ch] / totalLetters) * 100).toFixed(2));
    }
  }

  return { counts, percentages, totalLetters };
}

// Calculate Index of Coincidence (IoC)
export function calculateIoC(text: string): { unscaled: number; scaled: number } {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const N = clean.length;
  if (N <= 1) return { unscaled: 0, scaled: 0 };

  const counts: Record<string, number> = {};
  for (const ch of clean) {
    counts[ch] = (counts[ch] || 0) + 1;
  }

  let numerator = 0;
  for (const ch in counts) {
    const fi = counts[ch];
    numerator += fi * (fi - 1);
  }

  const denominator = N * (N - 1);
  const unscaled = numerator / denominator;
  const scaled = unscaled * 26; // Normalized where English is ~1.73

  return {
    unscaled: parseFloat(unscaled.toFixed(5)),
    scaled: parseFloat(scaled.toFixed(4)),
  };
}

// Shannon Entropy of text
export function calculateEntropy(text: string): number {
  if (!text) return 0;
  const counts: Record<string, number> = {};
  for (const ch of text) {
    counts[ch] = (counts[ch] || 0) + 1;
  }
  const len = text.length;
  let entropy = 0;
  for (const ch in counts) {
    const p = counts[ch] / len;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(3));
}

// Caesar Brute Force with Chi-Squared Score
export interface CaesarShiftCandidate {
  shift: number;
  decryptedPreview: string;
  chiSquare: number;
  rank: number;
}

export function bruteForceCaesar(ciphertext: string): CaesarShiftCandidate[] {
  const clean = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  const N = clean.length;
  const candidates: CaesarShiftCandidate[] = [];

  for (let shift = 0; shift < 26; shift++) {
    // Decrypt with shift
    let decrypted = '';
    const counts: Record<string, number> = {};

    for (let i = 0; i < ciphertext.length; i++) {
      const ch = ciphertext[i];
      const isUpper = ch >= 'A' && ch <= 'Z';
      const isLower = ch >= 'a' && ch <= 'z';
      if (isUpper || isLower) {
        const base = isUpper ? 65 : 97;
        const code = ch.charCodeAt(0) - base;
        const newCode = (code - shift + 26) % 26;
        const resCh = String.fromCharCode(base + newCode);
        decrypted += resCh;
        const up = resCh.toUpperCase();
        counts[up] = (counts[up] || 0) + 1;
      } else {
        decrypted += ch;
      }
    }

    // Chi-square test against English
    let chiSquare = 0;
    if (N > 0) {
      for (const ch in ENGLISH_FREQUENCIES) {
        const observed = counts[ch] || 0;
        const expected = (ENGLISH_FREQUENCIES[ch] / 100) * N;
        if (expected > 0) {
          chiSquare += Math.pow(observed - expected, 2) / expected;
        }
      }
    }

    candidates.push({
      shift,
      decryptedPreview: decrypted.slice(0, 120),
      chiSquare: parseFloat(chiSquare.toFixed(2)),
      rank: 0,
    });
  }

  // Sort by lowest chi-square (best fit to English)
  candidates.sort((a, b) => a.chiSquare - b.chiSquare);
  candidates.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  return candidates;
}

// Kasiski Examination to find likely Vigenère key lengths
export function kasiskiExamination(text: string): {
  keyLengthEstimates: { length: number; score: number }[];
  repeatedGrams: { gram: string; distances: number[] }[];
} {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const gramMap = new Map<string, number[]>();

  // Find 3-gram and 4-gram repetitions
  for (let len of [3, 4]) {
    for (let i = 0; i <= clean.length - len; i++) {
      const gram = clean.slice(i, i + len);
      if (!gramMap.has(gram)) {
        gramMap.set(gram, []);
      }
      gramMap.get(gram)!.push(i);
    }
  }

  const repeatedGrams: { gram: string; distances: number[] }[] = [];
  const factorCounts: Record<number, number> = {};

  for (const [gram, positions] of gramMap.entries()) {
    if (positions.length > 1) {
      const distances: number[] = [];
      for (let i = 1; i < positions.length; i++) {
        const dist = positions[i] - positions[i - 1];
        distances.push(dist);

        // Factors between 2 and 16
        for (let factor = 2; factor <= 16; factor++) {
          if (dist % factor === 0) {
            factorCounts[factor] = (factorCounts[factor] || 0) + 1;
          }
        }
      }
      repeatedGrams.push({ gram, distances });
    }
  }

  // Rank candidate lengths
  const keyLengthEstimates = Object.entries(factorCounts)
    .map(([lengthStr, count]) => ({
      length: parseInt(lengthStr, 10),
      score: count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return { keyLengthEstimates, repeatedGrams: repeatedGrams.slice(0, 8) };
}

// Friedman Test to estimate key length
export function friedmanTest(text: string): number {
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const N = clean.length;
  if (N <= 20) return 0;
  const { unscaled: ioc } = calculateIoC(clean);
  const kp = 0.0667; // English IoC
  const kr = 0.0385; // Random IoC
  const denominator = (N - 1) * ioc - kr * N + kp;
  if (denominator <= 0) return 0;
  const k = ((kp - kr) * N) / denominator;
  return Math.max(1, Math.round(k));
}

const EN_FREQ_ARRAY = Array.from({ length: 26 }, (_, i) => ENGLISH_FREQUENCIES[String.fromCharCode(65 + i)] / 100);
const COMMON_BIGRAMS = new Set(
  'TH HE IN ER AN RE ON AT EN ND TI ES OR TE OF ED IS IT AL AR ST TO NT NG SE HA AS OU IO LE VE CO ME DE HI RI RO IC NE EA RA CE LI CH LL BE MA SI OM UR'.split(' ')
);

function chiSquaredCounts(counts: number[], n: number): number {
  let chi = 0;
  for (let i = 0; i < 26; i++) {
    const expected = EN_FREQ_ARRAY[i] * n;
    chi += Math.pow(counts[i] - expected, 2) / expected;
  }
  return chi;
}

function rankShiftsForColumn(nums: number[], col: number, keyLen: number): { shift: number; chi: number }[] {
  const counts = new Array(26).fill(0);
  let n = 0;
  for (let i = col; i < nums.length; i += keyLen) {
    counts[nums[i]]++;
    n++;
  }
  const ranked: { shift: number; chi: number }[] = [];
  for (let shift = 0; shift < 26; shift++) {
    const shifted = Array.from({ length: 26 }, (_, i) => counts[(i + shift) % 26]);
    ranked.push({ shift, chi: chiSquaredCounts(shifted, n) });
  }
  return ranked.sort((a, b) => a.chi - b.chi);
}

export function crackVigenere(ciphertext: string): { keyLength: number; key: string; plaintext: string } | null {
  const clean = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length < 20) return null;
  const nums = Array.from(clean, (ch) => ch.charCodeAt(0) - 65);
  const N = nums.length;

  const maxLen = Math.min(20, Math.max(1, Math.floor(N / 3)));
  const iocByLength: number[] = [0];
  for (let len = 1; len <= maxLen; len++) {
    let total = 0;
    for (let col = 0; col < len; col++) {
      let colText = '';
      for (let i = col; i < N; i += len) colText += clean[i];
      total += calculateIoC(colText).unscaled;
    }
    iocByLength.push(total / len);
  }
  const maxIoC = Math.max(...iocByLength);
  let keyLen = 1;
  for (let len = 1; len <= maxLen; len++) {
    if (iocByLength[len] >= 0.9 * maxIoC) {
      keyLen = len;
      break;
    }
  }

  const keyForLength = (len: number) =>
    Array.from({ length: len }, (_, col) => rankShiftsForColumn(nums, col, len)[0].shift);
  const plaintextChi = (key: number[]) => {
    const counts = new Array(26).fill(0);
    nums.forEach((v, i) => counts[(v - key[i % key.length] + 26) % 26]++);
    return chiSquaredCounts(counts, N);
  };
  const bigramScore = (key: number[]) => {
    let hits = 0;
    for (let i = 0; i < N - 1; i++) {
      const c1 = (nums[i] - key[i % key.length] + 26) % 26;
      const c2 = (nums[i + 1] - key[(i + 1) % key.length] + 26) % 26;
      const bg = String.fromCharCode(65 + c1) + String.fromCharCode(65 + c2);
      if (COMMON_BIGRAMS.has(bg)) hits++;
    }
    return hits;
  };

  let bestKey = keyForLength(keyLen);
  let bestScore = bigramScore(bestKey);
  let bestChi = plaintextChi(bestKey);

  // Try top shifts per column
  for (let col = 0; col < keyLen; col++) {
    const ranked = rankShiftsForColumn(nums, col, keyLen);
    for (let r = 1; r < Math.min(5, ranked.length); r++) {
      const candidate = [...bestKey];
      candidate[col] = ranked[r].shift;
      const bg = bigramScore(candidate);
      const chi = plaintextChi(candidate);
      if (bg > bestScore || (bg === bestScore && chi < bestChi)) {
        bestKey = candidate;
        bestScore = bg;
        bestChi = chi;
      }
    }
  }

  // Period reduction: collapse repeating patterns (e.g. KEYKEY -> KEY)
  for (let p = 1; p <= Math.floor(bestKey.length / 2); p++) {
    if (bestKey.length % p === 0) {
      let isPeriod = true;
      for (let i = 0; i < bestKey.length; i++) {
        if (bestKey[i] !== bestKey[i % p]) {
          isPeriod = false;
          break;
        }
      }
      if (isPeriod) {
        bestKey = bestKey.slice(0, p);
        break;
      }
    }
  }

  const key = bestKey.map((k) => String.fromCharCode(65 + k)).join('');

  // Decrypt full text preserving case, spaces and punctuation
  let plaintext = '';
  let keyIdx = 0;
  for (let i = 0; i < ciphertext.length; i++) {
    const ch = ciphertext[i];
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';
    if (isUpper || isLower) {
      const base = isUpper ? 65 : 97;
      const code = ch.charCodeAt(0) - base;
      const shift = bestKey[keyIdx % bestKey.length];
      const decCode = (code - shift + 26) % 26;
      plaintext += String.fromCharCode(base + decCode);
      keyIdx++;
    } else {
      plaintext += ch;
    }
  }

  return {
    keyLength: key.length,
    key,
    plaintext,
  };
}

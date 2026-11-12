import { PasswordMetrics } from '../types/crypto';

const COMMON_DICTIONARY = [
  'password', 'admin', 'welcome', 'login', 'secret', 'hunter', 'dragon', 'master',
  'monkey', 'football', 'shadow', 'superman', 'trustno1', 'iloveyou', 'starwars',
  'letmein', 'princess', 'solo', 'michael', 'jessica', 'charlie', 'system',
  'access', 'security', 'crypto', 'cipher', 'hacker', 'matrix', 'terminal',
];

const KEYBOARD_SEQUENCES = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890', '0987654321',
  'qazwsxedcrfv', 'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz'
];

const DICEWARE_WORDLIST = [
  'anchor', 'beacon', 'cipher', 'delta', 'echo', 'falcon', 'glacier', 'horizon',
  'island', 'jaguar', 'kinetic', 'lunar', 'matrix', 'nebula', 'orbit', 'pulsar',
  'quantum', 'radar', 'sonar', 'titan', 'umbra', 'vortex', 'whisper', 'xenon',
  'yield', 'zenith', 'arrow', 'bridge', 'castle', 'dragon', 'ember', 'forest',
  'galaxy', 'harbor', 'iron', 'jungle', 'knight', 'legend', 'meteor', 'nexus',
  'oasis', 'phantom', 'quest', 'river', 'shield', 'thunder', 'unity', 'valiant',
  'winter', 'zen', 'arcade', 'breeze', 'comet', 'drift', 'elixir', 'flare',
];

function formatTime(seconds: number): string {
  if (seconds < 0.001) return 'Instant (< 1 ms)';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  const days = hours / 24;
  if (days < 365) return `${days.toFixed(0)} days`;
  const years = days / 365;
  if (years < 1000) return `${years.toFixed(1)} years`;
  if (years < 1000000) return `${(years / 1000).toFixed(1)} thousand years`;
  if (years < 1000000000) return `${(years / 1000000).toFixed(1)} million years`;
  return `${(years / 1000000000).toFixed(1)} billion years`;
}

export function analyzePassword(password: string): PasswordMetrics {
  const length = password.length;
  if (length === 0) {
    return {
      length: 0,
      entropy: 0,
      charsetSize: 0,
      hasLower: false,
      hasUpper: false,
      hasNumbers: false,
      hasSymbols: false,
      patterns: {
        hasDictionaryWords: false,
        detectedWords: [],
        hasKeyboardWalk: false,
        hasRepeatedChars: false,
        hasDatePattern: false,
      },
      crackTimes: {
        online: 'Instant',
        offlineFast: 'Instant',
        offlineSlow: 'Instant',
      },
    };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasNumbers) charsetSize += 10;
  if (hasSymbols) charsetSize += 33;

  // Calculate Keyspace Entropy: E = L * log2(R)
  const poolSize = Math.max(1, charsetSize);
  const rawEntropy = length * Math.log2(poolSize);

  // Pattern detection
  const lowerPass = password.toLowerCase();
  const detectedWords: string[] = [];

  for (const word of COMMON_DICTIONARY) {
    if (lowerPass.includes(word)) {
      detectedWords.push(word);
    }
  }

  let hasKeyboardWalk = false;
  for (const seq of KEYBOARD_SEQUENCES) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const sub = seq.slice(i, i + 3);
      if (lowerPass.includes(sub)) {
        hasKeyboardWalk = true;
        break;
      }
    }
    if (hasKeyboardWalk) break;
  }

  const hasRepeatedChars = /(.)\1{2,}/.test(password);
  const hasDatePattern = /(19\d{2}|20\d{2})/.test(password) || /\d{2}[-/]\d{2}[-/]\d{2,4}/.test(password);

  // Penalize entropy if strong patterns are detected
  let penalty = 0;
  if (detectedWords.length > 0) penalty += 15 * detectedWords.length;
  if (hasKeyboardWalk) penalty += 10;
  if (hasRepeatedChars) penalty += 8;
  if (hasDatePattern) penalty += 10;

  const effectiveEntropy = Math.max(0, Math.round(rawEntropy - penalty));

  // Combinations = 2^entropy
  const totalGuesses = Math.pow(2, effectiveEntropy);

  // Crack speeds:
  // Online: 100/sec
  // Offline fast (GPU hashcat NTLM/MD5): 100 billion / sec (1e11)
  // Offline slow (PBKDF2/bcrypt/argon2): 10,000 / sec (1e4)
  const onlineSec = totalGuesses / 100;
  const offlineFastSec = totalGuesses / 1e11;
  const offlineSlowSec = totalGuesses / 1e4;

  return {
    length,
    entropy: effectiveEntropy,
    charsetSize,
    hasLower,
    hasUpper,
    hasNumbers,
    hasSymbols,
    patterns: {
      hasDictionaryWords: detectedWords.length > 0,
      detectedWords,
      hasKeyboardWalk,
      hasRepeatedChars,
      hasDatePattern,
    },
    crackTimes: {
      online: formatTime(onlineSec),
      offlineFast: formatTime(offlineFastSec),
      offlineSlow: formatTime(offlineSlowSec),
    },
  };
}

export function generateSecurePassword(options: {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
}): string {
  let chars = '';
  if (options.useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (options.useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.useNumbers) chars += '0123456789';
  if (options.useSymbols) chars += '!@#$%^&*()_+~|}{[]:;?><,./-=';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

  const randomValues = new Uint32Array(options.length);
  window.crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < options.length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export function generateDicewarePassphrase(wordCount = 4, separator = '-'): string {
  const randomIndices = new Uint32Array(wordCount);
  window.crypto.getRandomValues(randomIndices);

  const selectedWords: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const word = DICEWARE_WORDLIST[randomIndices[i] % DICEWARE_WORDLIST.length];
    selectedWords.push(word);
  }
  return selectedWords.join(separator);
}

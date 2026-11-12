export type Language = 'en' | 'ar';
export type ActiveTab = 
  | 'landing' 
  | 'classical' 
  | 'modern' 
  | 'analysis' 
  | 'steganography' 
  | 'password' 
  | 'ctf' 
  | 'tutor';

export type ClassicalCipherType = 
  | 'caesar' 
  | 'vigenere' 
  | 'playfair' 
  | 'hill' 
  | 'railfence' 
  | 'substitution';

export interface ClassicalStep {
  stepIndex: number;
  inputChar: string;
  outputChar: string;
  explanation: string;
  highlightCoordinates?: [number, number]; // e.g. for Playfair 5x5 or Hill
  matrixState?: number[][];
  substitutions?: Record<string, string>;
  railCoordinates?: { rail: number; col: number; char: string }[];
}

export interface ClassicalCipherResult {
  output: string;
  steps: ClassicalStep[];
  auxiliaryData?: {
    playfairGrid?: string[][];
    hillMatrix?: number[][];
    hillInverse?: number[][];
    railFenceGrid?: (string | null)[][];
    substitutionKey?: Record<string, string>;
  };
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  module: string;
  operation: string;
  summary: string;
  detail?: string;
}

export interface CTFChallenge {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cipherType: string;
  scenario: string;
  ciphertext: string;
  flag: string;
  points: number;
  hints: string[];
}

export interface CTFStats {
  solvedCount: number;
  totalScore: number;
  currentStreak: number;
  solvedIds: string[];
  fastestSolveSeconds?: number;
}

export interface PasswordMetrics {
  length: number;
  entropy: number;
  charsetSize: number;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  patterns: {
    hasDictionaryWords: boolean;
    detectedWords: string[];
    hasKeyboardWalk: boolean;
    hasRepeatedChars: boolean;
    hasDatePattern: boolean;
  };
  crackTimes: {
    online: string;
    offlineFast: string;
    offlineSlow: string;
  };
}

export interface AIAnalysisResult {
  identifiedCipher: string;
  confidence: number;
  plaintext: string;
  recoveredKey?: string;
  reasoningSteps: string[];
  cipherDetails?: string;
}

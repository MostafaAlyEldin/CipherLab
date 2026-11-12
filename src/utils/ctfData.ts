import { CTFChallenge, CTFStats } from '../types/crypto';

export const INITIAL_CTF_CHALLENGES: CTFChallenge[] = [
  {
    id: 'ctf-easy-1',
    title: 'The Centurion Whispers',
    difficulty: 'easy',
    cipherType: 'Caesar Cipher',
    scenario: 'An intercepted legionnaire runner dropped an encoded papyrus outside the imperial garrison. The garrison commander is notorious for shifting his alphabet by prime numbers.',
    ciphertext: 'KHOOR ZRUOG WKLV LV BRXU ILUVW IODJ: IODJ{MXOLXV_FDHVDU_URPD_99}',
    flag: 'FLAG{JULIUS_CAESAR_ROMA_99}',
    points: 100,
    hints: [
      'The cipher shifts every letter forward by the exact same static integer offset.',
      'Check the frequency of letter "O" and "R" or test shift values between 1 and 5.',
      'The shift value is 3 (ROT-3). K -> H, H -> E, O -> L.',
    ],
  },
  {
    id: 'ctf-easy-2',
    title: 'Zig-Zag Across the Border',
    difficulty: 'easy',
    cipherType: 'Rail Fence Cipher',
    scenario: 'Reconnaissance picked up an oscillating frequency pattern. The signal pulses up and down in a 3-tier wave like railway tracks before being transmitted.',
    ciphertext: 'F{LNSL9LGRI_EC_TAT_1}AAFEEH3',
    flag: 'FLAG{RAIL_FENCE_STEALTH_913}',
    points: 120,
    hints: [
      'Notice how the characters bounce like a wave up and down rails.',
      'The number of rails is small — likely 3 rails.',
      'Write out 3 empty rails in a zigzag, fill the 3 rows with the ciphertext letters, and read diagonally.',
    ],
  },
  {
    id: 'ctf-med-1',
    title: 'The Diplomat’s Polyalphabetic Secret',
    difficulty: 'medium',
    cipherType: 'Vigenère Cipher',
    scenario: 'Black-hat operatives routed a communication through an encrypted proxy relay. Intelligence suspects they used a classic French diplomat cipher with the keyword "ENIGMA".',
    ciphertext: 'QRMZ MT HNET! RLET{XUXYTUWTUC_GVXNQR_WBTBQD_42}',
    flag: 'FLAG{POLYPHONIC_CIPHER_SOLVED_42}',
    points: 250,
    hints: [
      'Unlike Caesar, this cipher uses a repeating keyword to shift each position differently.',
      'The key word has 6 letters and was mentioned in the intercepted dispatch briefing.',
      'The key is "ENIGMA". Subtract the key letter values modulo 26 from the ciphertext letters.',
    ],
  },
  {
    id: 'ctf-med-2',
    title: 'Lord Playfair’s Digraphs',
    difficulty: 'medium',
    cipherType: 'Playfair Cipher',
    scenario: 'A syndicate server room locked its root terminal with a 5x5 polybius grid based on the passphrase "MONARCHY". Can you unscramble the paired letters? (Playfair drops symbols, so submit the recovered words as FLAG{WORD_WORD_WORD}.)',
    ciphertext: 'PDFGSMIKTQSMHGBSNKAKCDMKMBBV',
    flag: 'FLAG{PLAYFAIR_GRID_BREACH}',
    points: 280,
    hints: [
      'This cipher operates on pairs of letters (digraphs) using a 5x5 matrix combining I and J.',
      'Build the 5x5 grid with the key "MONARCHY" followed by remaining alphabet letters.',
      'Decrypt with key MONARCHY: the message reads THE FLAG IS ... — wrap the last three words as FLAG{...} with underscores.',
    ],
  },
  {
    id: 'ctf-hard-1',
    title: 'Matrix Inversion Protocol',
    difficulty: 'hard',
    cipherType: 'Hill Cipher (2x2)',
    scenario: 'A high-frequency satellite telemetry burst encoded its flag using a 2x2 linear algebraic transformation matrix K = [[3, 2], [5, 7]]. Find the modular inverse det mod 26 and decode. (Hill drops symbols — submit the last four words as FLAG{WORD_WORD_WORD_WORD}.)',
    ciphertext: 'OJLRHWGQLHBPKVLDMIZILMRPZICWYF',
    flag: 'FLAG{HILL_LINEAR_ALGEBRA_WIN}',
    points: 500,
    hints: [
      'Calculate the determinant of K: (3*7 - 2*5) = 21 - 10 = 11.',
      'Find the modular multiplicative inverse of 11 mod 26. Since 11 * 19 = 209 = 26 * 8 + 1, invDet = 19.',
      'Inverse matrix K^-1 = 19 * [[7, -2], [-5, 3]] mod 26 = [[3, 14], [9, 5]]. Multiply each digraph vector by this inverse!',
    ],
  },
];

const STATS_KEY = 'cipherlab_ctf_stats';

export function getStoredCTFStats(): CTFStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    solvedCount: 0,
    totalScore: 0,
    currentStreak: 0,
    solvedIds: [],
  };
}

export function saveCTFStats(stats: CTFStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

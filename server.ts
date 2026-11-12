import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. AI Cryptanalysis Endpoint
app.post('/api/gemini/cryptanalysis', async (req: Request, res: Response) => {
  try {
    const { ciphertext, stats, language = 'en' } = req.body;
    if (!ciphertext || typeof ciphertext !== 'string') {
      return res.status(400).json({ error: 'Ciphertext is required' });
    }

    const prompt = `You are a world-class cryptanalyst and cryptologist AI. Analyze the following unknown ciphertext.
Provide your response in JSON format.
Language preference: ${language === 'ar' ? 'Arabic' : 'English'}.

CIPHERTEXT SAMPLE (up to 1000 chars):
${ciphertext.slice(0, 1000)}

STATISTICAL METRICS COMPUTED BY WORKBENCH:
- Length: ${ciphertext.length} characters
- Index of Coincidence (IoC): ${stats?.ioc ? stats.ioc.toFixed(4) : 'N/A'} (English standard is ~0.0667, random polyalphabetic is ~0.0385)
- Entropy per character: ${stats?.entropy ? stats.entropy.toFixed(3) : 'N/A'} bits
- Top letter frequencies: ${JSON.stringify(stats?.topFrequencies || {})}
- Chi-Square best Caesar shift candidate: ${stats?.bestCaesarShift !== undefined ? stats.bestCaesarShift : 'N/A'}
- Kasiski key length estimate: ${stats?.kasiskiEstimate || 'N/A'}
- Recovered Vigenère key guess (from column IoC + Chi-square): ${stats?.vigenereKeyGuess || 'N/A'}

Your task:
1. Identify the likely cipher or encoding type (e.g. Caesar, Vigenère, Playfair, Monoalphabetic Substitution, Rail Fence, Base64, Hex, Hash, or AES/transposition).
2. Attempt decryption or provide candidate plaintext.
3. Provide confidence score (0 to 100).
4. Give a clear step-by-step breakdown of your reasoning (referencing letter frequencies, IoC, repeated patterns, etc.).
5. If recovered, specify the likely key.

Return strictly a valid JSON object matching this schema:
{
  "identifiedCipher": "Name of Cipher (e.g. Vigenère Cipher (Key: SECRET))",
  "confidence": 85,
  "plaintext": "Decrypted plaintext preview or full recovered text",
  "recoveredKey": "Estimated or exact key if identified",
  "reasoningSteps": [
    "Step 1: Analyzed IoC...",
    "Step 2: Examined n-gram repetitions...",
    "Step 3: Tested frequency correlation..."
  ],
  "cipherDetails": "Brief technical summary of this cipher mechanism and vulnerabilities"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Cryptanalysis error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to perform AI cryptanalysis',
    });
  }
});

// 2. AI Password Hardening Tips (PRIVACY-PRESERVING: ONLY RECEIVES METRICS, NO PASSWORD)
app.post('/api/gemini/password-tips', async (req: Request, res: Response) => {
  try {
    const { metrics, language = 'en' } = req.body;
    if (!metrics) {
      return res.status(400).json({ error: 'Metrics are required' });
    }

    const prompt = `You are an offensive security and credential security auditor.
Analyze ONLY these objective metrics of a candidate password (note: the actual password string is never transmitted, keeping full user zero-knowledge privacy):

METRICS:
- Length: ${metrics.length} characters
- Shannon Entropy: ${metrics.entropy} bits
- Character Set Pool Size: ${metrics.charsetSize}
- Character Types: Lowercase (${metrics.hasLower}), Uppercase (${metrics.hasUpper}), Numbers (${metrics.hasNumbers}), Symbols (${metrics.hasSymbols})
- Detected Patterns:
  * Dictionary words detected: ${metrics.patterns?.hasDictionaryWords ? 'YES' : 'NO'}
  * Sequential keyboard walks (e.g. qwerty, 12345): ${metrics.patterns?.hasKeyboardWalk ? 'YES' : 'NO'}
  * Repeated consecutive characters: ${metrics.patterns?.hasRepeatedChars ? 'YES' : 'NO'}
  * Apparent date/year sequences: ${metrics.patterns?.hasDatePattern ? 'YES' : 'NO'}
- Estimated Crack Times:
  * Online attack (throttled): ${metrics.crackTimes?.online}
  * Offline fast GPU hash (e.g. NTLM / MD5 100 GH/s): ${metrics.crackTimes?.offlineFast}
  * Offline slow PBKDF2 / Argon2id: ${metrics.crackTimes?.offlineSlow}

Provide your response in JSON format.
Language: ${language === 'ar' ? 'Arabic' : 'English'}.
Schema:
{
  "summary": "1-2 sentence overall assessment",
  "vulnerabilityRisks": [
    "Specific risk based on the patterns found..."
  ],
  "recommendations": [
    "Concrete actionable advice to increase entropy..."
  ],
  "passphraseComparison": "Brief explanation of how a Diceware/passphrase approach would compare for this entropy profile"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Password tips error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate password analysis tips',
    });
  }
});

// 3. AI CTF Challenge Generator (Server generates plaintext, local app computes guaranteed cipher)
app.post('/api/gemini/ctf-generate', async (req: Request, res: Response) => {
  try {
    const { difficulty = 'easy', language = 'en', seed = Date.now() } = req.body;

    const keyRequirement =
      difficulty === 'easy'
        ? 'A shift number between 1 and 25 (e.g. "3" or "7" or "13")'
        : difficulty === 'medium'
        ? 'A 5 to 7 uppercase letter keyword (e.g. "CIPHER" or "SECRET" or "SHADOW")'
        : 'An 8 to 10 uppercase letter keyword (e.g. "QUANTUMKEY" or "PROTECTION")';

    const prompt = `You are a DEF CON CTF designer. Create a realistic Cryptography CTF Challenge scenario.
IMPORTANT: Do NOT perform any encryption yourself. The client app will mathematically encrypt the plaintext with perfect accuracy.

Difficulty level: ${difficulty.toUpperCase()}
Key Requirement for keyUsed: ${keyRequirement}
Language for story and hints: ${language === 'ar' ? 'Arabic' : 'English'}.
Seed: ${seed}

Rules:
1. scenario: 1-2 sentence realistic cyber briefing (rogue agent intercept, satellite telemetry, black-hat transmission).
2. flag: Format "FLAG{WORD_WORD_WORD}" (2 to 4 words with underscores and optional digits, e.g. "FLAG{ORBIT_STATION_ALPHA}").
3. plaintext: UPPERCASE ENGLISH ONLY, 1-2 sentences of clean readable text that MUST END WITH the exact flag string (e.g. "INTELLIGENCE CONFIRMED ENEMY RENDEZVOUS AT DAWN FLAG{ORBIT_STATION_ALPHA}").
4. keyUsed:
   - For easy: a string containing an integer 1-25 (e.g. "7").
   - For medium: a 5-7 letter uppercase keyword (e.g. "CIPHER").
   - For hard: an 8-10 letter uppercase keyword (e.g. "ENCRYPTION").
5. hints: Array of 3 progressive textual hints for the solver.

Respond strictly with valid JSON matching:
{
  "title": "Operation Name / Challenge Title",
  "difficulty": "${difficulty}",
  "keyUsed": "THE_KEY",
  "scenario": "Engaging briefing paragraph...",
  "plaintext": "UPPERCASE PLAINTEXT ENDING WITH FLAG{...}",
  "flag": "FLAG{...}",
  "hints": [
    "Subtle hint 1...",
    "Key structure hint 2...",
    "Strong clue hint 3..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('CTF generator error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate CTF challenge',
    });
  }
});


// 4. AI Tutor Chat & "Explain This" Endpoint
app.post('/api/gemini/tutor', async (req: Request, res: Response) => {
  try {
    const { messages = [], language = 'en', contextSnippet } = req.body;

    const systemInstruction = `You are Professor Ada, an elite cryptography educator, computer scientist, and cryptanalyst at CipherLab.
Your goal is to explain classical and modern cryptographic concepts with supreme clarity, mathematical rigor made accessible, and cybersecurity practical context.
Language: ${language === 'ar' ? 'Arabic (العربية) with standard cryptographic terminology' : 'English'}.

Key pedagogy:
- Use clear analogies (e.g., color mixing for Diffie-Hellman, one-way trapdoors for RSA, padlock analogy, avalanche effect).
- When explaining algorithms, walk through concrete tiny examples (e.g. modular arithmetic, GCD, XOR truth tables, AES S-Box substitution).
- Point out real-world vulnerabilities (ECB mode Penguin, frequency attacks on monoalphabetic ciphers, padding oracle attacks, reuse of IV/nonce in GCM).
- Be engaging, supportive, and hacker-mindset oriented. Monospace code or math snippets in markdown when helpful.
${contextSnippet ? `\nThe user asked about this specific workbench context: "${contextSnippet}". Focus directly on explaining this.` : ''}`;

    // Convert messages for GoogleGenAI
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (formattedContents.length === 0) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: 'Hello! What can you teach me about cryptography?' }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      text: response.text || 'Unable to generate response.',
    });
  } catch (error: any) {
    console.error('AI Tutor error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to query AI Tutor',
    });
  }
});

// Serve frontend in production or Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CipherLab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

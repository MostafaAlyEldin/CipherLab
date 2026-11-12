import React, { useState, useEffect } from 'react';
import { Language } from '../types/crypto';
import { translations } from '../utils/translations';
import {
  encryptAesGcm,
  decryptAesGcm,
  encryptFileAes,
  decryptFileAes,
  generateRsaKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  generateSignatureKeys,
  signMessage,
  verifySignature,
  computeHash,
  calculateBitDifference,
  AesEncryptedPackage,
  RsaKeyPairPem,
} from '../utils/webCrypto';
import {
  Lock,
  Unlock,
  Key,
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  Sparkles,
  Shield,
  FileCheck,
  Binary,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ModernModuleProps {
  language: Language;
  onExplainWithAI: (context: string) => void;
  onAddHistory: (item: { module: string; operation: string; summary: string; detail?: string }) => void;
  onShowToast: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const ModernModule: React.FC<ModernModuleProps> = ({
  language,
  onExplainWithAI,
  onAddHistory,
  onShowToast,
}) => {
  const t = translations[language];
  const [subTab, setSubTab] = useState<'aes' | 'rsa' | 'hash' | 'avalanche'>('aes');

  // --- AES-256-GCM State ---
  const [aesText, setAesText] = useState('Confidential corporate intelligence dispatch.');
  const [aesPassword, setAesPassword] = useState('SuperSecretCipherLabKey2026!');
  const [aesEncryptedPkg, setAesEncryptedPkg] = useState<AesEncryptedPackage | null>(null);
  const [aesDecryptedText, setAesDecryptedText] = useState('');
  const [aesFile, setAesFile] = useState<File | null>(null);
  const [isAesLoading, setIsAesLoading] = useState(false);

  // --- RSA-OAEP 2048 State ---
  const [rsaKeys, setRsaKeys] = useState<RsaKeyPairPem | null>(null);
  const [rsaPlaintext, setRsaPlaintext] = useState('Top Secret Quantum Transmission');
  const [rsaCiphertext, setRsaCiphertext] = useState('');
  const [rsaDecrypted, setRsaDecrypted] = useState('');
  const [isGeneratingRsa, setIsGeneratingRsa] = useState(false);

  // Digital Signatures
  const [sigKeys, setSigKeys] = useState<CryptoKeyPair | null>(null);
  const [sigMessageText, setSigMessageText] = useState('Authorized contract approval #8942');
  const [signatureB64, setSignatureB64] = useState('');
  const [sigVerificationResult, setSigVerificationResult] = useState<boolean | null>(null);

  // --- Hashing State ---
  const [hashAlgorithm, setHashAlgorithm] = useState<'SHA-1' | 'SHA-256' | 'SHA-512'>('SHA-256');
  const [hashInputText, setHashInputText] = useState('The quick brown fox jumps over the lazy dog');
  const [hashHexResult, setHashHexResult] = useState('');
  const [hashFile, setHashFile] = useState<File | null>(null);

  // --- Avalanche Effect State ---
  const [avalancheInputA, setAvalancheInputA] = useState('The quick brown fox jumps over the lazy dog');
  const [avalancheInputB, setAvalancheInputB] = useState('The quick brown fox jumps over the lazy cog');
  const [hashBitsA, setHashBitsA] = useState('');
  const [hashBitsB, setHashBitsB] = useState('');
  const [hashHexA, setHashHexA] = useState('');
  const [hashHexB, setHashHexB] = useState('');

  // Initial setup: RSA generation & Avalanche hashes
  useEffect(() => {
    handleGenerateRsaKeys();
    handleGenerateSigKeys();
  }, []);

  useEffect(() => {
    runHashCalculation();
  }, [hashAlgorithm, hashInputText]);

  useEffect(() => {
    runAvalancheComparison();
  }, [avalancheInputA, avalancheInputB]);

  // --- AES Actions ---
  const handleAesEncrypt = async () => {
    try {
      setIsAesLoading(true);
      const pkg = await encryptAesGcm(aesText, aesPassword);
      setAesEncryptedPkg(pkg);
      setAesDecryptedText('');
      onShowToast({ text: 'AES-256-GCM encryption complete', type: 'success' });
      onAddHistory({
        module: 'Modern Encryption',
        operation: 'AES-256-GCM Encrypt',
        summary: `Encrypted text (${aesText.length} chars) with PBKDF2 key`,
      });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    } finally {
      setIsAesLoading(false);
    }
  };

  const handleAesDecrypt = async () => {
    if (!aesEncryptedPkg) return;
    try {
      setIsAesLoading(true);
      const decrypted = await decryptAesGcm(aesEncryptedPkg, aesPassword);
      setAesDecryptedText(decrypted);
      onShowToast({ text: 'AES-256-GCM decryption verified', type: 'success' });
      onAddHistory({
        module: 'Modern Encryption',
        operation: 'AES-256-GCM Decrypt',
        summary: `Decrypted ciphertext: "${decrypted.slice(0, 25)}..."`,
      });
    } catch {
      onShowToast({ text: 'Decryption failed! Incorrect password or corrupted tag.', type: 'error' });
    } finally {
      setIsAesLoading(false);
    }
  };

  const handleEncryptFile = async () => {
    if (!aesFile) {
      onShowToast({ text: 'Please select a file first', type: 'error' });
      return;
    }
    try {
      setIsAesLoading(true);
      const { blob } = await encryptFileAes(aesFile, aesPassword);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${aesFile.name}.enc`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast({ text: `Encrypted file downloaded (${aesFile.name}.enc)`, type: 'success' });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    } finally {
      setIsAesLoading(false);
    }
  };

  const handleDecryptFile = async () => {
    if (!aesFile) {
      onShowToast({ text: 'Please upload an encrypted .enc file', type: 'error' });
      return;
    }
    try {
      setIsAesLoading(true);
      const decryptedBlob = await decryptFileAes(aesFile, aesPassword);
      const origName = aesFile.name.replace(/\.enc$/i, '') || 'decrypted_file.bin';
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = origName;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast({ text: `Decrypted file downloaded (${origName})`, type: 'success' });
    } catch {
      onShowToast({ text: 'File decryption failed: wrong password or invalid format.', type: 'error' });
    } finally {
      setIsAesLoading(false);
    }
  };

  // --- RSA Actions ---
  const handleGenerateRsaKeys = async () => {
    try {
      setIsGeneratingRsa(true);
      const keys = await generateRsaKeyPair();
      setRsaKeys(keys);
      setRsaCiphertext('');
      setRsaDecrypted('');
      onShowToast({ text: 'New 2048-bit RSA Keypair generated', type: 'success' });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    } finally {
      setIsGeneratingRsa(false);
    }
  };

  const handleRsaEncrypt = async () => {
    if (!rsaKeys) return;
    try {
      const b64 = await rsaEncrypt(rsaPlaintext, rsaKeys.publicKey);
      setRsaCiphertext(b64);
      setRsaDecrypted('');
      onShowToast({ text: 'RSA-OAEP encryption successful', type: 'success' });
      onAddHistory({
        module: 'Modern Encryption',
        operation: 'RSA-OAEP 2048 Encrypt',
        summary: `Encrypted ${rsaPlaintext.length} chars with Public Key`,
      });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    }
  };

  const handleRsaDecrypt = async () => {
    if (!rsaKeys || !rsaCiphertext) return;
    try {
      const plaintext = await rsaDecrypt(rsaCiphertext, rsaKeys.privateKey);
      setRsaDecrypted(plaintext);
      onShowToast({ text: 'RSA-OAEP decryption successful', type: 'success' });
      onAddHistory({
        module: 'Modern Encryption',
        operation: 'RSA-OAEP 2048 Decrypt',
        summary: `Decrypted with Private Key: "${plaintext.slice(0, 30)}..."`,
      });
    } catch {
      onShowToast({ text: 'RSA decryption failed: private key mismatch or corrupted buffer.', type: 'error' });
    }
  };

  const handleGenerateSigKeys = async () => {
    try {
      const kp = await generateSignatureKeys();
      setSigKeys(kp);
    } catch {}
  };

  const handleSign = async () => {
    if (!sigKeys) return;
    try {
      const sig = await signMessage(sigMessageText, sigKeys.privateKey);
      setSignatureB64(sig);
      setSigVerificationResult(null);
      onShowToast({ text: 'Message digitally signed with RSASSA-PKCS1-v1_5', type: 'success' });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    }
  };

  const handleVerify = async () => {
    if (!sigKeys || !signatureB64) return;
    try {
      const valid = await verifySignature(sigMessageText, signatureB64, sigKeys.publicKey);
      setSigVerificationResult(valid);
      onShowToast({
        text: valid ? 'Signature is VALID! Authentic sender.' : 'INVALID SIGNATURE! Tampered message.',
        type: valid ? 'success' : 'error',
      });
    } catch {
      setSigVerificationResult(false);
      onShowToast({ text: 'Signature verification error', type: 'error' });
    }
  };

  // --- Hash & Avalanche Actions ---
  const runHashCalculation = async () => {
    try {
      const res = await computeHash(hashAlgorithm, hashInputText);
      setHashHexResult(res.hex);
    } catch {}
  };

  const handleHashFileChange = async (file: File) => {
    setHashFile(file);
    try {
      const buf = await file.arrayBuffer();
      const res = await computeHash(hashAlgorithm, buf);
      setHashHexResult(res.hex);
      onShowToast({ text: `${file.name} hashed successfully (${hashAlgorithm})`, type: 'success' });
    } catch (err: any) {
      onShowToast({ text: err.message, type: 'error' });
    }
  };

  const runAvalancheComparison = async () => {
    try {
      const resA = await computeHash('SHA-256', avalancheInputA);
      const resB = await computeHash('SHA-256', avalancheInputB);
      setHashBitsA(resA.bits);
      setHashBitsB(resB.bits);
      setHashHexA(resA.hex);
      setHashHexB(resB.hex);
    } catch {}
  };

  const bitDiff = calculateBitDifference(hashBitsA, hashBitsB);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {t.modern}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30">
              Web Crypto Native
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browser hardware-accelerated encryption: AES-256-GCM, RSA-OAEP 2048-bit keypairs, digital signatures, and cryptographic hashing.
          </p>
        </div>

        <button
          onClick={() =>
            onExplainWithAI(
              `Explain modern cryptography: ${subTab.toUpperCase()} algorithm, PBKDF2 key derivation, authentication tags, and why Avalanche Effect matters.`
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.explainWithAI}</span>
        </button>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {[
          { id: 'aes', label: 'AES-256-GCM (Text & File)', icon: Lock },
          { id: 'rsa', label: 'RSA-OAEP 2048 & Signatures', icon: Key },
          { id: 'hash', label: 'Cryptographic Hashing (SHA)', icon: Binary },
          { id: 'avalanche', label: t.hashCompare, icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
                subTab === tab.id
                  ? 'bg-cyan-500 text-black shadow-md cyber-glow-cyan'
                  : 'border border-slate-800 bg-[#0d131a] text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. AES-256-GCM WORKSPACE */}
      {subTab === 'aes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Plaintext & Password Input */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Plaintext / Secret Message
                </label>
                <button
                  onClick={() =>
                    setAesText('Operation Blackout: rendezvous at satellite relay station 09:00 UTC.')
                  }
                  className="text-[11px] font-mono text-cyan-400 hover:underline"
                >
                  {t.loadExample}
                </button>
              </div>

              <textarea
                rows={3}
                value={aesText}
                onChange={(e) => setAesText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-800 bg-[#070b0f] text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500 resize-none mb-3"
              />

              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Passphrase (PBKDF2 SHA-256 Derivation)
              </label>
              <input
                type="text"
                value={aesPassword}
                onChange={(e) => setAesPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleAesEncrypt}
                  disabled={isAesLoading || !aesText || !aesPassword}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypt with AES-256-GCM</span>
                </button>
                <button
                  onClick={handleAesDecrypt}
                  disabled={isAesLoading || !aesEncryptedPkg}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 font-semibold text-xs hover:bg-cyan-500/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Decrypt Verification</span>
                </button>
              </div>
            </div>

            {/* File Encryption Panel */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                {t.fileEncryption} (Binary Stream)
              </h3>
              <p className="text-xs text-slate-400 mb-3 font-sans">
                Encrypt any file (PDF, PNG, DOCX, ZIP) into an authenticated <code className="text-cyan-400 font-mono">.enc</code> container prepended with salt and IV.
              </p>

              <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 text-center mb-4 transition-colors">
                <input
                  type="file"
                  id="aes-file-input"
                  onChange={(e) => setAesFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="aes-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-cyan-400"
                >
                  <Upload className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs font-mono font-medium">
                    {aesFile ? `Selected: ${aesFile.name} (${(aesFile.size / 1024).toFixed(1)} KB)` : 'Choose or drop a file to encrypt/decrypt'}
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleEncryptFile}
                  disabled={!aesFile || isAesLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Encrypt & Download</span>
                </button>

                <button
                  onClick={handleDecryptFile}
                  disabled={!aesFile || isAesLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 text-xs font-medium hover:border-cyan-500/50 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Decrypt Uploaded .enc</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AES Diagnostic Package Breakdown */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm flex-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                <span>Cryptographic Metadata Package</span>
                <span className="text-[10px] text-cyan-400 font-mono">100,000 PBKDF2 Rounds</span>
              </h3>

              {aesEncryptedPkg ? (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Derived 256-bit Key (Hex):</span>
                    <div className="p-2.5 rounded-lg bg-[#070b0f] border border-slate-800 text-emerald-400 break-all select-all">
                      {aesEncryptedPkg.derivedKeyHex}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block mb-1">Salt (16 bytes):</span>
                      <div className="p-2 rounded-lg bg-[#070b0f] border border-slate-800 text-cyan-300 break-all select-all">
                        {aesEncryptedPkg.saltHex}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">IV / Nonce (12 bytes):</span>
                      <div className="p-2 rounded-lg bg-[#070b0f] border border-slate-800 text-amber-300 break-all select-all">
                        {aesEncryptedPkg.ivHex}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Authentication Tag (16 bytes):</span>
                    <div className="p-2 rounded-lg bg-[#070b0f] border border-slate-800 text-purple-300 break-all select-all">
                      {aesEncryptedPkg.tagHex}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Ciphertext Payload (Base64):</span>
                    <div className="p-3 rounded-lg bg-[#070b0f] border border-slate-800 text-cyan-400 break-all select-all max-h-28 overflow-y-auto cyber-border-glow">
                      {aesEncryptedPkg.ciphertext}
                    </div>
                  </div>

                  {aesDecryptedText && (
                    <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-mono">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                        Decryption Integrity Verified (AEAD Tag Matched):
                      </div>
                      <div className="text-white font-medium">{aesDecryptedText}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs font-mono text-center p-4 border border-dashed border-slate-800 rounded-xl">
                  <Lock className="w-8 h-8 text-slate-600 mb-2" />
                  <span>Click "Encrypt with AES-256-GCM" to inspect live derived keys, random salt, IV nonce, and authentication tag.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. RSA-OAEP 2048 & SIGNATURES */}
      {subTab === 'rsa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Keypair Generation & PEM Display */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  RSA-OAEP 2048-bit Keypair
                </h3>
                <button
                  onClick={handleGenerateRsaKeys}
                  disabled={isGeneratingRsa}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Generate New Keypair</span>
                </button>
              </div>

              {rsaKeys ? (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-emerald-400 font-semibold block mb-1">Public Key (SPKI PEM):</span>
                    <pre className="p-2.5 rounded-lg bg-[#070b0f] border border-slate-800 text-slate-300 text-[11px] overflow-x-auto max-h-32 select-all">
                      {rsaKeys.publicKeyPem}
                    </pre>
                  </div>

                  <div>
                    <span className="text-cyan-400 font-semibold block mb-1">Private Key (PKCS#8 PEM):</span>
                    <pre className="p-2.5 rounded-lg bg-[#070b0f] border border-slate-800 text-slate-400 text-[11px] overflow-x-auto max-h-32 select-all">
                      {rsaKeys.privateKeyPem}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs font-mono text-slate-500">
                  Generating initial RSA-OAEP 2048-bit primes...
                </div>
              )}
            </div>

            {/* Digital Signatures Box */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                Digital Signatures (RSASSA-PKCS1-v1_5)
              </h3>
              <p className="text-xs text-slate-400 mb-3 font-sans">
                Sign messages with your private key to guarantee sender authenticity and tamper-detection.
              </p>

              <input
                type="text"
                value={sigMessageText}
                onChange={(e) => setSigMessageText(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-slate-200 font-mono text-xs mb-3"
              />

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handleSign}
                  className="flex-1 py-2 rounded-lg bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 cursor-pointer"
                >
                  Sign Message
                </button>
                <button
                  onClick={handleVerify}
                  disabled={!signatureB64}
                  className="flex-1 py-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  Verify Signature
                </button>
              </div>

              {signatureB64 && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 font-mono">Digital Signature (Base64):</div>
                  <div className="p-2 rounded bg-[#070b0f] border border-slate-800 text-cyan-300 text-[10px] font-mono break-all max-h-16 overflow-y-auto select-all">
                    {signatureB64}
                  </div>
                  {sigVerificationResult !== null && (
                    <div
                      className={`p-2 rounded text-xs font-mono font-bold flex items-center gap-2 ${
                        sigVerificationResult
                          ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/50 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>{sigVerificationResult ? 'VERIFIED: Authentic signature signed by private key' : 'FAILED: Signature invalid or payload was modified'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RSA Encryption / Decryption Interface */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm flex-1 flex flex-col">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
                Asymmetric Public/Private Encryption
              </h3>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Plaintext to Encrypt with Public Key:
                  </label>
                  <textarea
                    rows={2}
                    value={rsaPlaintext}
                    onChange={(e) => setRsaPlaintext(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none"
                  />
                  <button
                    onClick={handleRsaEncrypt}
                    disabled={!rsaKeys}
                    className="mt-2 w-full py-2 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Encrypt with 2048-bit Public Key
                  </button>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    RSA-OAEP Ciphertext (Base64):
                  </label>
                  <textarea
                    rows={4}
                    value={rsaCiphertext}
                    onChange={(e) => setRsaCiphertext(e.target.value)}
                    placeholder="Ciphertext appears here..."
                    className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#070b0f] text-cyan-400 font-mono text-xs break-all resize-none"
                  />
                  <button
                    onClick={handleRsaDecrypt}
                    disabled={!rsaKeys || !rsaCiphertext}
                    className="mt-2 w-full py-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Decrypt with 2048-bit Private Key
                  </button>
                </div>

                {rsaDecrypted && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 font-mono text-xs text-emerald-300">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                      Decrypted Plaintext:
                    </span>
                    <span className="text-white text-sm font-semibold">{rsaDecrypted}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. HASHING (SHA-1, SHA-256, SHA-512) */}
      {subTab === 'hash' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
                Cryptographic Hash Generator
              </h3>

              <div className="flex items-center gap-2 mb-4">
                {(['SHA-1', 'SHA-256', 'SHA-512'] as const).map((algo) => (
                  <button
                    key={algo}
                    onClick={() => setHashAlgorithm(algo)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      hashAlgorithm === algo
                        ? 'bg-cyan-500 text-black shadow'
                        : 'border border-slate-800 bg-[#070b0f] text-slate-400 hover:text-white'
                    }`}
                  >
                    {algo}
                  </button>
                ))}
              </div>

              <label className="text-xs font-mono text-slate-400 block mb-1">Text to Hash:</label>
              <textarea
                rows={4}
                value={hashInputText}
                onChange={(e) => setHashInputText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-800 bg-[#070b0f] text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none mb-4"
              />

              <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30">
                <label className="text-xs font-mono text-slate-400 block mb-2">Or Hash a File:</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleHashFileChange(f);
                  }}
                  className="text-xs font-mono text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-slate-800 file:text-cyan-400 file:font-mono file:text-xs hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  {hashAlgorithm} Digest Output
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">
                  {hashHexResult.length * 4} bits ({hashHexResult.length} hex chars)
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-[#070b0f] text-cyan-300 font-mono text-sm break-all select-all cyber-border-glow mb-4">
                {hashHexResult || 'Calculating digest...'}
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs font-sans text-slate-400 space-y-2">
                <div className="font-bold text-slate-200 font-mono">Properties of {hashAlgorithm}:</div>
                <p>• One-Way Pre-image Resistance: Computationally infeasible to reverse hash to original input.</p>
                <p>• Collision Resistance: Highly improbable to find any two distinct inputs yielding identical hashes.</p>
                <p>• Fixed Length: Always outputs uniform bit-length regardless of input magnitude.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AVALANCHE EFFECT COMPARISON */}
      {subTab === 'avalanche' && (
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0c1219]/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold font-mono text-white">
                {t.hashCompare} (Strict Avalanche Criterion)
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                Ideal SHA-256 target: ~50% bit flip
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6 font-sans">
              Changing even a single bit in the input message should scramble approximately 50% of the output hash bits pseudo-randomly.
            </p>

            {/* Inputs Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#070b0f]">
                <label className="text-xs font-mono font-bold text-emerald-400 block mb-2">
                  Input String A:
                </label>
                <textarea
                  rows={2}
                  value={avalancheInputA}
                  onChange={(e) => setAvalancheInputA(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#0a0f15] text-slate-200 font-mono text-xs resize-none"
                />
                <div className="mt-2 text-[11px] font-mono text-slate-400 break-all">
                  SHA-256: <span className="text-emerald-400">{hashHexA}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#070b0f]">
                <label className="text-xs font-mono font-bold text-cyan-400 block mb-2">
                  Input String B (Differing by 1 character):
                </label>
                <textarea
                  rows={2}
                  value={avalancheInputB}
                  onChange={(e) => setAvalancheInputB(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-800 bg-[#0a0f15] text-slate-200 font-mono text-xs resize-none"
                />
                <div className="mt-2 text-[11px] font-mono text-slate-400 break-all">
                  SHA-256: <span className="text-cyan-400">{hashHexB}</span>
                </div>
              </div>
            </div>

            {/* Avalanche Metric Scoreboard */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Flipped Bit Count:</span>
                <div className="text-3xl font-bold font-mono text-emerald-400">
                  {bitDiff.diffCount} / {bitDiff.totalBits} bits
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 uppercase">Avalanche Magnitude:</span>
                <div className="text-3xl font-bold font-mono text-cyan-400">
                  {bitDiff.percentage}%
                </div>
              </div>
            </div>

            {/* 256-Bit Visualization Grid */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>Bit Difference Matrix (256 Bits):</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                    <span>Flipped Bit ({bitDiff.diffCount})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 inline-block" />
                    <span>Unchanged Bit ({bitDiff.totalBits - bitDiff.diffCount})</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 p-3 rounded-xl border border-slate-800 bg-[#070b0f] overflow-x-auto">
                {Array.from({ length: 256 }).map((_, idx) => {
                  const isFlipped = bitDiff.diffIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      title={`Bit #${idx + 1}: ${isFlipped ? 'Flipped' : 'Identical'} (A: ${hashBitsA[idx] || 0}, B: ${hashBitsB[idx] || 0})`}
                      className={`h-4 rounded-sm flex items-center justify-center font-mono text-[9px] cursor-help transition-all ${
                        isFlipped
                          ? 'bg-rose-500 text-white font-bold shadow-sm shadow-rose-950'
                          : 'bg-slate-800/80 text-slate-600'
                      }`}
                    >
                      {hashBitsA[idx] || '0'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AES-256-GCM encryption for sensitive tokens stored in the database.
 * Uses ENCRYPTION_KEY environment variable (32-byte hex string).
 *
 * Encrypted format: "enc:v1:<iv_hex>:<ciphertext_hex>:<tag_hex>"
 * Plaintext values (legacy) don't have the "enc:" prefix and are returned as-is.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/** Encrypt a plaintext string. Returns prefixed ciphertext. */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

/** Decrypt a value. Handles both encrypted (prefixed) and legacy plaintext values. */
export function decrypt(value: string): string {
  // Legacy plaintext - return as-is
  if (!value.startsWith(PREFIX)) {
    return value;
  }

  const key = getKey();
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");

  const [ivHex, ciphertextHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Check if a value is already encrypted */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

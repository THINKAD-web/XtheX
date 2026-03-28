"use client";

import type { InquiryE2eEnvelopeV1 } from "./inquiry-e2e-schema";
import { parseInquiryE2eEnvelope } from "./inquiry-e2e-schema";

function bytesToB64(u8: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type InquiryE2ePayload = {
  message: string;
  contactPhone?: string;
};

/** Detached copy so Web Crypto sees a plain `ArrayBuffer` (strict TS / SAB-safe). */
function copyToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const b = new ArrayBuffer(u8.byteLength);
  new Uint8Array(b).set(u8);
  return b;
}

export async function importInquiryE2ePublicKey(publicKeySpkiBase64: string): Promise<CryptoKey> {
  const raw = b64ToBytes(publicKeySpkiBase64);
  return crypto.subtle.importKey(
    "spki",
    copyToArrayBuffer(raw),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
}

/** PKCS#8 PEM → CryptoKey (RSA-OAEP decrypt). */
export async function importInquiryE2ePrivateKeyFromPem(pem: string): Promise<CryptoKey> {
  const lines = pem.trim().split("\n");
  const b64 = lines
    .filter((l) => !l.includes("BEGIN") && !l.includes("END"))
    .join("")
    .replace(/\s/g, "");
  const raw = b64ToBytes(b64);
  return crypto.subtle.importKey(
    "pkcs8",
    copyToArrayBuffer(raw),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );
}

export async function encryptInquiryPayload(
  publicKeySpkiBase64: string,
  payload: InquiryE2ePayload,
): Promise<string> {
  const rsaPub = await importInquiryE2ePublicKey(publicKeySpkiBase64.trim());
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plaintext,
  );
  const rawAes = await crypto.subtle.exportKey("raw", aesKey);
  const wrappedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPub,
    copyToArrayBuffer(new Uint8Array(rawAes)),
  );
  const envelope: InquiryE2eEnvelopeV1 = {
    v: 1,
    wrappedKey: bytesToB64(new Uint8Array(wrappedKey)),
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(envelope);
}

export async function decryptInquiryEnvelope(
  privateKeyPem: string,
  envelopeJson: string,
): Promise<InquiryE2ePayload> {
  const env = parseInquiryE2eEnvelope(envelopeJson);
  if (!env) throw new Error("Invalid envelope");
  const rsaPriv = await importInquiryE2ePrivateKeyFromPem(privateKeyPem);
  const wrapped = b64ToBytes(env.wrappedKey);
  const aesRaw = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaPriv,
    copyToArrayBuffer(wrapped),
  );
  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesRaw,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const iv = b64ToBytes(env.iv);
  const ciphertext = b64ToBytes(env.ciphertext);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    aesKey,
    copyToArrayBuffer(ciphertext),
  );
  const text = new TextDecoder().decode(plainBuf);
  const obj = JSON.parse(text) as InquiryE2ePayload;
  if (typeof obj.message !== "string") throw new Error("Invalid payload");
  return obj;
}

function pkcs8ToPem(u8: Uint8Array): string {
  const b64 = bytesToB64(u8);
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

export async function generateInquiryE2eKeyPair(): Promise<{
  publicSpkiB64: string;
  privatePkcs8Pem: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
  const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicSpkiB64: bytesToB64(new Uint8Array(spki)),
    privatePkcs8Pem: pkcs8ToPem(new Uint8Array(pkcs8)),
  };
}

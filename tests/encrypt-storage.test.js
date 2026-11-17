// @vitest-environment node
import { webcrypto } from "node:crypto";
import { createRequire } from "node:module";
import { IDBFactory } from "fake-indexeddb";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  check_create_key,
  decryptMessage,
  encryptMessage,
  import_key,
  save_key,
  sha256sum,
} = require("../encrypt-storage.js");

const user = "test-user";
const apiKey = "test-api-key-not-a-real-credential";
let keyPair;

function readStoredKey(userName) {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("cve-services.apikeyStore", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("keyStore", "readonly");
      const read = tx.objectStore("keyStore").get(userName);
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      tx.oncomplete = () => db.close();
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}

describe("encrypted credential key storage", () => {
  beforeAll(async () => {
    vi.stubGlobal("window", { crypto: webcrypto, indexedDB: new IDBFactory() });
    vi.stubGlobal("crypto", webcrypto);
    keyPair = await check_create_key(user);
  }, 30000);

  afterAll(() => vi.unstubAllGlobals());

  it("persists a non-extractable private key and reuses it", async () => {
    const record = await readStoredKey(user);
    expect(record.user).toBe(user);
    expect(keyPair.privateKey.algorithm.modulusLength).toBe(4096);
    expect(record.key.epr.extractable).toBe(false);
    expect(record.key.epr.usages).toEqual(["decrypt"]);
    await expect(webcrypto.subtle.exportKey("jwk", record.key.epr)).rejects.toThrow();
    await expect(webcrypto.subtle.exportKey("pkcs8", record.key.epr)).rejects.toThrow();

    const publicJwk = await webcrypto.subtle.exportKey("jwk", record.key.epb);
    expect(record.sum.sha256).toBe(await sha256sum(publicJwk.n));
    const restored = await check_create_key(user);
    const ciphertext = await encryptMessage(apiKey, keyPair.publicKey);
    expect(await decryptMessage(ciphertext, restored.privateKey)).toBe(apiKey);
  });

  it("does not expose the plaintext credential in encoded ciphertext", async () => {
    const ciphertext = await encryptMessage(apiKey, keyPair.publicKey);
    const stored = Buffer.from(ciphertext).toString("base64");
    expect(stored).not.toContain(apiKey);
    expect(Buffer.from(stored, "base64").includes(Buffer.from(apiKey))).toBe(false);
    expect(await decryptMessage(ciphertext, keyPair.privateKey)).toBe(apiKey);
  });

  it("still lets same-origin code decrypt with the IndexedDB key", async () => {
    const ciphertext = await encryptMessage(apiKey, keyPair.publicKey);
    const record = await readStoredKey(user);
    expect(await decryptMessage(ciphertext, record.key.epr)).toBe(apiKey);
  });

  it("converts extractable private keys before saving and supports legacy JWKs", async () => {
    const original = await webcrypto.subtle.generateKey(
      { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["encrypt", "decrypt"],
    );
    const legacy = {
      epr: await webcrypto.subtle.exportKey("jwk", original.privateKey),
      epb: await webcrypto.subtle.exportKey("jwk", original.publicKey),
    };
    const imported = await import_key(legacy);
    expect(imported.privateKey.extractable).toBe(false);
    const ciphertext = await encryptMessage(apiKey, original.publicKey);
    expect(await decryptMessage(ciphertext, imported.privateKey)).toBe(apiKey);

    await save_key("legacy-user", original);
    const record = await readStoredKey("legacy-user");
    expect(record.key.epr.extractable).toBe(false);
    await expect(webcrypto.subtle.exportKey("jwk", record.key.epr)).rejects.toThrow();
    expect(await decryptMessage(ciphertext, record.key.epr)).toBe(apiKey);
  });

  it("rejects oversized UTF-8 messages before encryption", async () => {
    const maximum = "a".repeat(444) + "é";
    expect(new TextEncoder().encode(maximum)).toHaveLength(446);
    const ciphertext = await encryptMessage(maximum, keyPair.publicKey);
    expect(await decryptMessage(ciphertext, keyPair.privateKey)).toBe(maximum);
    await expect(encryptMessage(maximum + "a", keyPair.publicKey)).rejects.toThrow(RangeError);
  });

  it("rejects key creation if saving the new private key fails", async () => {
    const indexedDB = window.indexedDB;
    let opens = 0;
    window.indexedDB = {
      open(...args) {
        if (++opens === 1) return indexedDB.open(...args);
        const request = { error: new Error("storage failed") };
        queueMicrotask(() => request.onerror());
        return request;
      },
    };
    const generate = vi.spyOn(webcrypto.subtle, "generateKey").mockResolvedValue(keyPair);
    try {
      await expect(check_create_key("storage-failure")).rejects.toThrow("storage failed");
    } finally {
      generate.mockRestore();
      window.indexedDB = indexedDB;
    }
  });
});

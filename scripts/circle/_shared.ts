import "dotenv/config";
import crypto from "crypto";
import axios from "axios";

export const CIRCLE_BASE_URL =
  process.env.CIRCLE_BASE_URL ?? "//api.circle.com/v1/w3s";

export function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function authHeaders() {
  return {
    Authorization: `Bearer ${mustEnv("CIRCLE_API_KEY")}`,
    "Content-Type": "application/json",
  };
}

export function uuidv4(): string {
  return crypto.randomUUID();
}

export function encryptEntitySecretCiphertext(params: {
  entitySecretHex: string;
  entityPublicKey: string; // PEM or base64 DER
}): string {
  const { entitySecretHex, entityPublicKey } = params;

  const secretBuf = Buffer.from(entitySecretHex, "hex");
  if (secretBuf.length !== 32) {
    throw new Error(
      `CIRCLE_ENTITY_SECRET_HEX must be 32 bytes (64 hex chars). Got ${secretBuf.length} bytes`
    );
  }

  const pem = normalizePublicKeyToPem(entityPublicKey);

  const ciphertext = crypto.publicEncrypt(
    {
      key: pem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    secretBuf
  );

  return ciphertext.toString("base64");
}

function normalizePublicKeyToPem(publicKey: string): string {
  if (publicKey.includes("BEGIN PUBLIC KEY")) return publicKey;

  const b64 = publicKey.replace(/\s+/g, "");
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----\n`;
}

export async function getEntityPublicKey(): Promise<string> {
  const res = await axios.get(`${CIRCLE_BASE_URL}/config/entity/publicKey`, {
    headers: authHeaders(),
  });
  return res.data?.data?.publicKey;
}

export async function circlePost<T>(path: string, body: any): Promise<T> {
  const res = await axios.post(`${CIRCLE_BASE_URL}${path}`, body, {
    headers: authHeaders(),
  });
  return res.data as T;
}

export async function circleGet<T>(path: string): Promise<T> {
  const res = await axios.get(`${CIRCLE_BASE_URL}${path}`, {
    headers: authHeaders(),
  });
  return res.data as T;
}

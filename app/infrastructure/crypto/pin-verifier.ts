const ALGORITHM = "pbkdf2_sha256";
const KEY_BITS = 256;

function base64(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function sameText(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return difference === 0;
}

// Checks a PIN against the server's `pbkdf2_sha256$<iterations>$<salt>$<base64>`
// verifier (SHA-256, 32-byte key, UTF-8 salt), without the network.
export async function verifyPin(
  pin: string,
  verifier: string,
): Promise<boolean> {
  const [algorithm, iterations, salt, expected] = verifier.split("$");
  if (algorithm !== ALGORITHM || !iterations || !salt || !expected) {
    return false;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations: Number(iterations),
    },
    key,
    KEY_BITS,
  );
  return sameText(base64(bits), expected);
}

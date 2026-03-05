/**
 * WebAuthn Browser Utilities
 *
 * Client-side helpers for FIDO2/WebAuthn ceremonies.
 * Handles Base64URL encoding, credential creation, and assertion.
 */

// ── Base64URL helpers ────────────────────────────────────────────────────────

export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── Feature Detection ────────────────────────────────────────────────────────

export async function isWebAuthnSupported(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    // @ts-ignore - conditional mediation is newer API
    return await PublicKeyCredential.isConditionalMediationAvailable?.() ?? false;
  } catch {
    return false;
  }
}

// ── Registration (Attestation) ───────────────────────────────────────────────

interface ServerRegistrationOptions {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ alg: number; type: "public-key" }>;
  timeout: number;
  excludeCredentials?: Array<{ id: string; type: "public-key"; transports?: string[] }>;
  authenticatorSelection?: {
    authenticatorAttachment?: "platform" | "cross-platform";
    residentKey?: "preferred" | "required" | "discouraged";
    userVerification?: "required" | "preferred" | "discouraged";
  };
  attestation?: string;
}

export async function startRegistration(options: ServerRegistrationOptions) {
  // Convert server options → browser-native PublicKeyCredentialCreationOptions
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToBuffer(options.challenge),
    rp: options.rp,
    user: {
      id: base64UrlToBuffer(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map((c) => ({
      id: base64UrlToBuffer(c.id),
      type: c.type,
      transports: c.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: options.authenticatorSelection,
    attestation: (options.attestation as AttestationConveyancePreference) || "direct",
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential;

  if (!credential) throw new Error("Credential creation was cancelled.");

  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      attestationObject: bufferToBase64Url(response.attestationObject),
    },
    authenticatorAttachment: (credential as any).authenticatorAttachment || null,
  };
}

// ── Authentication (Assertion) ───────────────────────────────────────────────

interface ServerAuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials?: Array<{ id: string; type: "public-key"; transports?: string[] }>;
  userVerification?: "required" | "preferred" | "discouraged";
}

export async function startAuthentication(options: ServerAuthenticationOptions) {
  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge: base64UrlToBuffer(options.challenge),
    timeout: options.timeout,
    rpId: options.rpId,
    allowCredentials: options.allowCredentials?.map((c) => ({
      id: base64UrlToBuffer(c.id),
      type: c.type,
      transports: c.transports as AuthenticatorTransport[],
    })),
    userVerification: options.userVerification || "required",
  };

  const credential = (await navigator.credentials.get({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential;

  if (!credential) throw new Error("Authentication was cancelled.");

  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
      userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined,
    },
  };
}

// ── Biometric Type Detection ─────────────────────────────────────────────────

export function detectBiometricType(): "fingerprint" | "face" | "platform" {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";

  // macOS → likely Touch ID
  if (platform.includes("mac") || ua.includes("macintosh")) return "fingerprint";

  // iOS → Face ID or Touch ID
  if (/iphone|ipad/.test(ua)) {
    // Newer iPhones (X+) use Face ID
    const screenHeight = window.screen.height;
    if (screenHeight >= 812) return "face";
    return "fingerprint";
  }

  // Android → usually fingerprint
  if (ua.includes("android")) return "fingerprint";

  // Windows → Windows Hello (face or fingerprint, default to platform)
  if (ua.includes("windows")) return "platform";

  return "platform";
}
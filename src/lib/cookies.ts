// Cookie utilities for auth tokens
export const AUTH_COOKIE_NAME = 'auth_token_frontend'

/**
 * Set the auth token in cookie (for middleware).
 */
export function setAuthCookie(token: string, expiresInMs: number = 7 * 24 * 60 * 60 * 1000) {
  if (typeof window === 'undefined') return;

  const date = new Date();
  date.setTime(date.getTime() + expiresInMs);
  const expires = "; expires=" + date.toUTCString();

  // Set the cookie using a unique name
  document.cookie = `${AUTH_COOKIE_NAME}=${token}${expires}; path=/; SameSite=Lax`;

  console.log(`[Storage] Token saved to cookie. Len: ${token.length}`);
}

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = AUTH_COOKIE_NAME + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      const token = c.substring(nameEQ.length, c.length);
      console.log('[Storage] Token recovered from COOKIE');
      return token;
    }
  }

  return null;
}

export function deleteAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;
  }
  console.log(`[Storage] Token cleared from storage`);
}

// Token utility functions for managing access and refresh tokens

interface Tokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Get both access and refresh tokens
 */
export function getTokens(): Tokens {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken')
  };
}

/**
 * Set both access and refresh tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Remove both access and refresh tokens from localStorage
 */
export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export type { Tokens };

/**
 * Utility functions for JWT token manipulation.
 * Decodes JWT tokens to extract payload information.
 */

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

/**
 * Decodes a JWT token and extracts the payload.
 *
 * @param token - The JWT token string
 * @returns The decoded payload
 * @throws Error if token is invalid
 */
export const decodeJwt = (token: string): JwtPayload => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode base64url payload
    const payloadBase64 = parts[1];
    const payload = JSON.parse(atob(payloadBase64));

    return payload as JwtPayload;
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extracts the user ID from a JWT token.
 * The user ID is stored in the 'sub' (subject) claim.
 *
 * @param token - The JWT token string
 * @returns The user ID
 */
export const extractUserIdFromToken = (token: string): string => {
  const payload = decodeJwt(token);
  return payload.sub;
};

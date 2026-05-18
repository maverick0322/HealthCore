import { describe, it, expect } from 'vitest';
import { decodeJwt, extractUserIdFromToken } from './jwt';

describe('JWT Utilities', () => {
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjEzNjE3Njg3LCJleHAiOjE2MTM2MjEyODd9.signature';

  describe('decodeJwt', () => {
    it('should successfully decode a valid JWT token', () => {
      const payload = decodeJwt(mockToken);

      expect(payload).toHaveProperty('sub');
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(payload.sub).toBe('test-user-123');
      expect(payload.email).toBe('test@example.com');
    });

    it('should throw error for invalid JWT format', () => {
      const invalidToken = 'invalid-token';

      expect(() => decodeJwt(invalidToken)).toThrow('Invalid JWT format');
    });

    it('should throw error for malformed payload', () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiJ9.not-valid-base64.signature';

      expect(() => decodeJwt(malformedToken)).toThrow('Failed to decode JWT');
    });

    it('should decode base64url payloads that contain url-safe characters', () => {
      const tokenWithBase64UrlPayload = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMy1hYmMiLCJlbWFpbCI6InRlc3QtdXNlcl9vbmVAZXhhbXBsZS5jb20iLCJpYXQiOjE2MTM2MTc2ODcsImV4cCI6MTYxMzYyMTI4N30.signature';

      const payload = decodeJwt(tokenWithBase64UrlPayload);

      expect(payload.sub).toBe('user_123-abc');
      expect(payload.email).toBe('test-user_one@example.com');
    });
  });

  describe('extractUserIdFromToken', () => {
    it('should successfully extract userId from a valid token', () => {
      const userId = extractUserIdFromToken(mockToken);

      expect(userId).toBe('test-user-123');
    });

    it('should throw error if token is invalid', () => {
      const invalidToken = 'invalid-token';

      expect(() => extractUserIdFromToken(invalidToken)).toThrow();
    });
  });
});

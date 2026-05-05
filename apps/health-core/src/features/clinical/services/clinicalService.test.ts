import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clinicalApi } from './clinicalService';
import httpClient from '@/core/http/httpClient';
import * as jwtUtils from '@/core/utils/jwt';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

vi.mock('@/core/http/httpClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/features/auth/store/useAuthStore');
vi.mock('@/core/utils/jwt');

const MOCK_USER_ID = 'test-user-123';
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.signature';

describe('clinicalApi Infrastructure', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (useAuthStore.getState as any).mockReturnValue({
      accessToken: MOCK_TOKEN,
    });
    
    (jwtUtils.extractUserIdFromToken as any).mockReturnValue(MOCK_USER_ID);
  });

  it('should successfully send data to POST /clinical/profile with X-User-Id header', async () => {
    const mockPayload = {
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE' as const,
      activityLevel: 'MODERATELY_ACTIVE' as const,
    };

    await clinicalApi.createProfile(mockPayload);

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(httpClient.post).toHaveBeenCalledWith(
      '/clinical/profile',
      mockPayload,
      { headers: { 'X-User-Id': MOCK_USER_ID } }
    );
  });

  it('should successfully fetch and return goals from GET /clinical/goals/me with X-User-Id header', async () => {
    const mockResponse = {
      data: {
        targetCalories: 2500,
        targetProtein: 150,
        targetCarbs: 250,
        targetFat: 70,
      }
    };
    
    (httpClient.get as any).mockResolvedValue(mockResponse);

    const result = await clinicalApi.getMyGoals();

    expect(httpClient.get).toHaveBeenCalledTimes(1);
    expect(httpClient.get).toHaveBeenCalledWith(
      '/clinical/goals/me',
      { headers: { 'X-User-Id': MOCK_USER_ID } }
    );
    
    expect(result).toEqual(mockResponse.data);
  });

  it('should successfully send weight update to POST /clinical/weight with X-User-Id header', async () => {
    const mockResponse = {
      data: {
        targetCalories: 2500,
        targetProtein: 150,
        targetCarbs: 250,
        targetFat: 70,
      }
    };
    
    (httpClient.post as any).mockResolvedValue(mockResponse);

    const result = await clinicalApi.updateWeight(75.5);

    expect(httpClient.post).toHaveBeenCalledWith(
      '/clinical/weight',
      { weightKg: 75.5 },
      { headers: { 'X-User-Id': MOCK_USER_ID } }
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('should successfully fetch weight history from GET /clinical/weight/history with X-User-Id header', async () => {
    const mockWeightHistory = {
      data: [
        { weightKg: 80, date: '2024-01-01' },
        { weightKg: 79.5, date: '2024-01-08' },
        { weightKg: 79, date: '2024-01-15' },
      ]
    };
    
    (httpClient.get as any).mockResolvedValue(mockWeightHistory);

    const result = await clinicalApi.getWeightHistory();

    expect(httpClient.get).toHaveBeenCalledTimes(1);
    expect(httpClient.get).toHaveBeenCalledWith(
      '/clinical/weight/history',
      { headers: { 'X-User-Id': MOCK_USER_ID } }
    );
    expect(result).toEqual(mockWeightHistory.data);
  });

  it('should handle empty weight history', async () => {
    const mockEmptyHistory = {
      data: []
    };
    
    (httpClient.get as any).mockResolvedValue(mockEmptyHistory);

    const result = await clinicalApi.getWeightHistory();

    expect(result).toEqual([]);
  });

  it('should throw error when no access token is available', async () => {
    (useAuthStore.getState as any).mockReturnValue({
      accessToken: null,
    });

    const mockPayload = {
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE' as const,
      activityLevel: 'MODERATELY_ACTIVE' as const,
    };

    await expect(clinicalApi.createProfile(mockPayload)).rejects.toThrow(
      'User is not authenticated. No access token found.'
    );
  });
});
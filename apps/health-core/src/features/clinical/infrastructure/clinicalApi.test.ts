import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clinicalApi } from './clinicalApi';
import httpClient from '@/core/http/httpClient';

vi.mock('@/core/http/httpClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('clinicalApi Infrastructure', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully send data to POST /api/v1/clinical/profile', async () => {
    const mockPayload = {
      weightKg: 75.5,
      heightCm: 180,
      birthDate: '1995-01-01',
      gender: 'MALE' as const,
      activityLevel: 'MODERATELY_ACTIVE' as const,
    };

    await clinicalApi.createProfile(mockPayload);

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    
    expect(httpClient.post).toHaveBeenCalledWith('/api/v1/clinical/profile', mockPayload);
  });

  it('should successfully fetch and return goals from GET /api/v1/clinical/goals/me', async () => {
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
    expect(httpClient.get).toHaveBeenCalledWith('/api/v1/clinical/goals/me');
    
    expect(result).toEqual(mockResponse.data);
  });
});
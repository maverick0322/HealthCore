import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetMyProfile,
  mockUpdateMyProfilePhoto,
  mockLogout,
  mockNavigate,
} = vi.hoisted(() => ({
  mockGetMyProfile: vi.fn(),
  mockUpdateMyProfilePhoto: vi.fn(),
  mockLogout: vi.fn(),
  mockNavigate: vi.fn(),
}));

let profilePhotoUploadOptions:
  | {
      onUploadComplete: (storageKey: string) => Promise<void>;
      invalidTypeMessage: string;
      invalidSizeMessage: string;
      persistErrorMessage: string;
      uploadErrorMessages: {
        validation: string;
        rateLimit: string;
        network: string;
        generic: string;
      };
    }
  | null = null;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => (namespace ? `${namespace}:${key}` : key),
  }),
}));

vi.mock('@/features/auth/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        email: 'ana@example.com',
        provider: 'LOCAL',
      },
      logout: mockLogout,
    }),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyProfile: mockGetMyProfile,
    updateMyProfilePhoto: mockUpdateMyProfilePhoto,
    unlinkPatient: vi.fn(),
  },
}));

vi.mock('@/shared/hooks/useProfilePhotoUpload', () => ({
  useProfilePhotoUpload: (
    options: NonNullable<typeof profilePhotoUploadOptions>,
  ) => {
    profilePhotoUploadOptions = options;

    return {
      accept: 'image/jpeg,image/png,image/webp',
      error: null,
      handleFileSelected: vi.fn(),
      isUploading: false,
    };
  },
}));

import { usePatientProfile } from './usePatientProfile';

describe('usePatientProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilePhotoUploadOptions = null;

    mockGetMyProfile.mockResolvedValue({
      userId: 'patient-1',
      firstName: 'Ana',
      paternalLastName: 'Lopez',
      maternalLastName: 'Ruiz',
      fullName: 'Ana Lopez Ruiz',
      birthDate: '1996-05-13',
      heightCm: 168,
      weightKg: 61.4,
      gender: 'FEMALE',
      activityLevel: 'LIGHTLY_ACTIVE',
      goal: 'health',
      dietType: 'vegetarian',
      allergies: [],
      excludedFoods: [],
      nutritionistId: null,
      profilePhotoUrl: null,
      profileCompleted: true,
    });
  });

  it('persists the uploaded patient profile photo through the profile hook', async () => {
    mockUpdateMyProfilePhoto.mockResolvedValue({
      userId: 'patient-1',
      firstName: 'Ana',
      paternalLastName: 'Lopez',
      maternalLastName: 'Ruiz',
      fullName: 'Ana Lopez Ruiz',
      birthDate: '1996-05-13',
      heightCm: 168,
      weightKg: 61.4,
      gender: 'FEMALE',
      activityLevel: 'LIGHTLY_ACTIVE',
      goal: 'health',
      dietType: 'vegetarian',
      allergies: [],
      excludedFoods: [],
      nutritionistId: null,
      profilePhotoUrl: 'https://cdn.example.com/patient-photo.webp',
      profileCompleted: true,
    });

    const { result } = renderHook(() => usePatientProfile());

    await waitFor(() => {
      expect(result.current.isLoadingProfile).toBe(false);
    });

    expect(profilePhotoUploadOptions?.invalidTypeMessage).toBe('patient:profile.photoInvalidType');

    await act(async () => {
      await profilePhotoUploadOptions?.onUploadComplete('patient/profile-photo.webp');
    });

    await waitFor(() => {
      expect(result.current.profile?.profilePhotoUrl).toBe('https://cdn.example.com/patient-photo.webp');
    });

    expect(mockUpdateMyProfilePhoto).toHaveBeenCalledWith('patient/profile-photo.webp');
  });
});

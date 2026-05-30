import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetMyNutritionistProfile,
  mockUpdateMyNutritionistProfilePhoto,
  mockLogout,
  mockNavigate,
} = vi.hoisted(() => ({
  mockGetMyNutritionistProfile: vi.fn(),
  mockUpdateMyNutritionistProfilePhoto: vi.fn(),
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
        email: 'nutri@example.com',
      },
      logout: mockLogout,
    }),
}));

vi.mock('@/features/clinical/services/clinicalService', () => ({
  clinicalApi: {
    getMyNutritionistProfile: mockGetMyNutritionistProfile,
    updateMyNutritionistProfilePhoto: mockUpdateMyNutritionistProfilePhoto,
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

import { useNutritionistProfile } from './useNutritionistProfile';

describe('useNutritionistProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilePhotoUploadOptions = null;

    mockGetMyNutritionistProfile.mockResolvedValue({
      userId: 'nutri-1',
      firstName: 'Laura',
      paternalLastName: 'Sanchez',
      maternalLastName: 'Diaz',
      fullName: 'Laura Sanchez Diaz',
      specializations: ['FOOD_SAFETY'],
      customSpecialization: '',
      professionalLicense: '12345678',
      consultationTypes: ['ONLINE'],
      phone: '5512345678',
      clinicAddress: null,
      bio: 'Nutriologa clinica con enfoque preventivo.',
      profilePhotoUrl: null,
      profileCompleted: true,
    });
  });

  it('persists the uploaded nutritionist profile photo through the profile hook', async () => {
    mockUpdateMyNutritionistProfilePhoto.mockResolvedValue({
      userId: 'nutri-1',
      firstName: 'Laura',
      paternalLastName: 'Sanchez',
      maternalLastName: 'Diaz',
      fullName: 'Laura Sanchez Diaz',
      specializations: ['FOOD_SAFETY'],
      customSpecialization: '',
      professionalLicense: '12345678',
      consultationTypes: ['ONLINE'],
      phone: '5512345678',
      clinicAddress: null,
      bio: 'Nutriologa clinica con enfoque preventivo.',
      profilePhotoUrl: 'https://cdn.example.com/nutritionist-photo.webp',
      profileCompleted: true,
    });

    const { result } = renderHook(() => useNutritionistProfile());

    await waitFor(() => {
      expect(result.current.isLoadingProfile).toBe(false);
    });

    expect(profilePhotoUploadOptions?.persistErrorMessage).toBe('nutritionist:profile.photoPersistError');

    await act(async () => {
      await profilePhotoUploadOptions?.onUploadComplete('nutritionist/profile-photo.webp');
    });

    await waitFor(() => {
      expect(result.current.profile?.profilePhotoUrl).toBe('https://cdn.example.com/nutritionist-photo.webp');
    });

    expect(mockUpdateMyNutritionistProfilePhoto).toHaveBeenCalledWith('nutritionist/profile-photo.webp');
  });
});

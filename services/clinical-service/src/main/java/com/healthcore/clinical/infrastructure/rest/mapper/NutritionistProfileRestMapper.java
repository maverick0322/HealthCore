package com.healthcore.clinical.infrastructure.rest.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;

@Component
public class NutritionistProfileRestMapper {

    private final ClinicAddressRestMapper clinicAddressRestMapper;

    public NutritionistProfileRestMapper(ClinicAddressRestMapper clinicAddressRestMapper) {
        this.clinicAddressRestMapper = clinicAddressRestMapper;
    }

    public NutritionistProfile toDomain(String userId, UpsertNutritionistProfileRequest request) {
        return new NutritionistProfile(
                userId,
                request.firstName(),
                request.paternalLastName(),
                request.maternalLastName(),
                request.specializations(),
                request.customSpecialization(),
                request.professionalLicense(),
                request.consultationTypes(),
                request.phone(),
                clinicAddressRestMapper.toDomain(request.clinicAddress()),
                request.bio(),
                null
        );
    }

    public NutritionistProfileResponse toResponse(NutritionistProfile profile, String profilePhotoUrl) {
        return new NutritionistProfileResponse(
                profile.getUserId(),
                profile.getFirstName(),
                profile.getPaternalLastName(),
                profile.getMaternalLastName(),
                profile.getFullName(),
                profile.getSpecializations() != null ? profile.getSpecializations() : List.of(),
                profile.getCustomSpecialization(),
                profile.getProfessionalLicense(),
                profile.getConsultationTypes() != null ? profile.getConsultationTypes() : List.of(),
                profile.getPhone(),
                clinicAddressRestMapper.toResponse(profile.getClinicAddress()),
                profile.getBio(),
                profilePhotoUrl,
                profile.isProfileCompleted()
        );
    }
}

package com.healthcore.clinical.infrastructure.rest.support;

import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.mapper.ClinicalProfileRestMapper;

public abstract class ClinicalControllerSupport {

    protected final ClinicalProfileRestMapper clinicalProfileRestMapper;
    protected final ProfilePhotoUrlResolver profilePhotoUrlResolver;

    protected ClinicalControllerSupport(
            ClinicalProfileRestMapper clinicalProfileRestMapper,
            ProfilePhotoUrlResolver profilePhotoUrlResolver
    ) {
        this.clinicalProfileRestMapper = clinicalProfileRestMapper;
        this.profilePhotoUrlResolver = profilePhotoUrlResolver;
    }

    protected PatientProfileResponse toPatientProfileResponse(PatientProfile profile) {
        return clinicalProfileRestMapper.toPatientProfileResponse(
                profile,
                profilePhotoUrlResolver.resolveSingleUrl(profile.getProfilePhotoKey())
        );
    }

    protected PatientProfileResponse toPatientProfileResponse(PatientProfile profile, String profilePhotoUrl) {
        return clinicalProfileRestMapper.toPatientProfileResponse(profile, profilePhotoUrl);
    }

    protected NutritionistProfileResponse toNutritionistProfileResponse(NutritionistProfile profile) {
        return clinicalProfileRestMapper.toNutritionistProfileResponse(
                profile,
                profilePhotoUrlResolver.resolveSingleUrl(profile.getProfilePhotoKey())
        );
    }

    protected String getCurrentUserId() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    protected String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}

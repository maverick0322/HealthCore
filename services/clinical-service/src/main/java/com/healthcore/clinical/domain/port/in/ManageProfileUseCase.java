package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.PatientProfile;
import java.util.Optional;

public interface ManageProfileUseCase {
    PatientProfile createOrUpdateProfile(PatientProfile profile);
    Optional<PatientProfile> getProfileByUserId(String userId);
}
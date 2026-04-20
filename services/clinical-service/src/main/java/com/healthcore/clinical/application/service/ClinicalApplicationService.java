package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ClinicalApplicationService implements ManageProfileUseCase {

    private final ClinicalRepositoryPort repositoryPort;

    public ClinicalApplicationService(ClinicalRepositoryPort repositoryPort) {
        this.repositoryPort = repositoryPort;
    }

    @Override
    public PatientProfile createOrUpdateProfile(PatientProfile profile) {
        return repositoryPort.save(profile);
    }

    @Override
    public Optional<PatientProfile> getProfileByUserId(String userId) {
        return repositoryPort.findByUserId(userId);
    }
}
package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClinicalApplicationService implements ManageProfileUseCase {

    private final ClinicalRepositoryPort repositoryPort;

    public ClinicalApplicationService(ClinicalRepositoryPort repositoryPort) {
        this.repositoryPort = repositoryPort;
    }

    @Override
    public PatientProfile createProfile(PatientProfile profile) { 
        return repositoryPort.save(profile);
    }

    @Override
    public Optional<PatientProfile> getProfileByUserId(String userId) {
        return repositoryPort.findByUserId(userId);
    }

    @Override
    public HealthGoal updateWeight(String userId, Double weightKg) {
        PatientProfile profile = repositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));
        
        HealthGoal newGoal = profile.updateWeight(weightKg);
        
        repositoryPort.save(profile);
        
        return newGoal;
    }

    @Override
    public List<WeightRecord> getWeightHistory(String userId) {
        return repositoryPort.findByUserId(userId)
                .map(PatientProfile::getWeightHistory)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));
    }
}
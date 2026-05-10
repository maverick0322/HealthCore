package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.in.LinkingUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.LinkingCodeRepositoryPort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Optional;

@Service
public class LinkingApplicationService implements LinkingUseCase {

    private final LinkingCodeRepositoryPort linkingCodeRepositoryPort;
    private final ClinicalRepositoryPort clinicalRepositoryPort;
    
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    public LinkingApplicationService(LinkingCodeRepositoryPort linkingCodeRepositoryPort, ClinicalRepositoryPort clinicalRepositoryPort) {
        this.linkingCodeRepositoryPort = linkingCodeRepositoryPort;
        this.clinicalRepositoryPort = clinicalRepositoryPort;
    }

    @Override
    public LinkingCode generateLinkingCode(String nutritionistId) {
        Optional<LinkingCode> existing = linkingCodeRepositoryPort.findByNutritionistId(nutritionistId);
        existing.ifPresent(code -> linkingCodeRepositoryPort.deleteByCode(code.getCode()));

        String code = generateRandomCode();
        LinkingCode linkingCode = new LinkingCode(code, nutritionistId, LocalDateTime.now());
        return linkingCodeRepositoryPort.save(linkingCode);
    }

    @Override
    public void linkPatient(String patientId, String code) {
        LinkingCode linkingCode = linkingCodeRepositoryPort.findByCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired linking code."));

        PatientProfile profile = clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));

        profile.assignNutritionist(linkingCode.getNutritionistId());
        clinicalRepositoryPort.save(profile);
    }

    @Override
    public void unlinkPatient(String patientId) {
        PatientProfile profile = clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));

        profile.removeNutritionist();
        clinicalRepositoryPort.save(profile);
    }

    @Override
    public void unlinkNutritionist(String nutritionistId, String patientId) {
        PatientProfile profile = clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));

        if (profile.getNutritionistId() == null || !profile.getNutritionistId().equals(nutritionistId)) {
            throw new IllegalStateException("Action denied: Patient is not linked to this nutritionist.");
        }

        profile.removeNutritionist();
        clinicalRepositoryPort.save(profile);
    }

    private String generateRandomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }

    @Override
    public LinkingCode getCurrentLinkingCode(String nutritionistId) {
        return linkingCodeRepositoryPort.findByNutritionistId(nutritionistId).orElse(null);
    }
}
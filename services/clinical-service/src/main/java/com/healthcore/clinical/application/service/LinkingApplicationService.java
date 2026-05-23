package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.AlreadyLinkedToNutritionistException;
import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.in.ManageNutritionPlanUseCase;
import com.healthcore.clinical.domain.port.out.AgendaLifecyclePort;
import com.healthcore.clinical.domain.port.in.LinkingUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.LinkingCodeRepositoryPort;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.security.SecureRandom;

@Service
public class LinkingApplicationService implements LinkingUseCase {
    private static final int MAX_GENERATION_ATTEMPTS = 10;

    private final LinkingCodeRepositoryPort linkingCodeRepositoryPort;
    private final ClinicalRepositoryPort clinicalRepositoryPort;
    private final ManageNutritionPlanUseCase manageNutritionPlanUseCase;
    private final AgendaLifecyclePort agendaLifecyclePort;
    
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    public LinkingApplicationService(
            LinkingCodeRepositoryPort linkingCodeRepositoryPort,
            ClinicalRepositoryPort clinicalRepositoryPort,
            ManageNutritionPlanUseCase manageNutritionPlanUseCase,
            AgendaLifecyclePort agendaLifecyclePort
    ) {
        this.linkingCodeRepositoryPort = linkingCodeRepositoryPort;
        this.clinicalRepositoryPort = clinicalRepositoryPort;
        this.manageNutritionPlanUseCase = manageNutritionPlanUseCase;
        this.agendaLifecyclePort = agendaLifecyclePort;
    }

    @Override
    public LinkingCode generateLinkingCode(String nutritionistId) {
        linkingCodeRepositoryPort.deleteByNutritionistId(nutritionistId);

        for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            String code = generateUniqueCodeCandidate();
            LinkingCode linkingCode = new LinkingCode(code, nutritionistId, LocalDateTime.now());

            try {
                return linkingCodeRepositoryPort.save(linkingCode);
            } catch (DuplicateKeyException exception) {
                if (attempt == MAX_GENERATION_ATTEMPTS - 1) {
                    throw exception;
                }
            }
        }

        throw new IllegalStateException("Unable to generate a unique linking code.");
    }

    @Override
    public void linkPatient(String patientId, String code) {
        LinkingCode linkingCode = linkingCodeRepositoryPort.findByCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired linking code."));

        if (linkingCode.isExpiredAt(LocalDateTime.now())) {
            linkingCodeRepositoryPort.deleteByCode(linkingCode.getCode());
            throw new IllegalArgumentException("Invalid or expired linking code.");
        }

        PatientProfile profile = clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));

        // Validate patient is not already linked to another nutritionist
        if (profile.getNutritionistId() != null && !profile.getNutritionistId().isEmpty()) {
            if (!profile.getNutritionistId().equals(linkingCode.getNutritionistId())) {
                throw new AlreadyLinkedToNutritionistException(
                        "Patient is already linked to another nutritionist. Please unlink first.",
                        profile.getNutritionistId()
                );
            }
            // Already linked to same nutritionist, no action needed
            return;
        }

        profile.assignNutritionist(linkingCode.getNutritionistId());
        clinicalRepositoryPort.save(profile);
    }

    @Override
    public void unlinkPatient(String patientId) {
        PatientProfile profile = clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));

        String nutritionistId = profile.getNutritionistId();
        if (nutritionistId != null && !nutritionistId.isBlank()) {
            agendaLifecyclePort.cancelFutureAppointmentsForUnlink(
                    patientId,
                    nutritionistId,
                    patientId,
                    "PATIENT_UNLINKED"
            );
        }
        profile.removeNutritionist();
        clinicalRepositoryPort.save(profile);
        if (nutritionistId != null && !nutritionistId.isBlank()) {
            manageNutritionPlanUseCase.archivePlansAfterUnlink(patientId, nutritionistId);
        }
    }

    @Override
    public void unlinkNutritionist(String nutritionistId, String patientId) {
        PatientProfile profile = clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));

        if (profile.getNutritionistId() == null || !profile.getNutritionistId().equals(nutritionistId)) {
            throw new IllegalStateException("Action denied: Patient is not linked to this nutritionist.");
        }

        agendaLifecyclePort.cancelFutureAppointmentsForUnlink(
                patientId,
                nutritionistId,
                nutritionistId,
                "NUTRITIONIST_UNLINKED"
        );
        profile.removeNutritionist();
        clinicalRepositoryPort.save(profile);
        manageNutritionPlanUseCase.archivePlansAfterUnlink(patientId, nutritionistId);
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
        LinkingCode linkingCode = linkingCodeRepositoryPort.findByNutritionistId(nutritionistId).orElse(null);
        if (linkingCode == null) {
            return null;
        }

        if (linkingCode.isExpiredAt(LocalDateTime.now())) {
            linkingCodeRepositoryPort.deleteByCode(linkingCode.getCode());
            return null;
        }

        return linkingCode;
    }

    private String generateUniqueCodeCandidate() {
        for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            String code = generateRandomCode();
            if (linkingCodeRepositoryPort.findByCode(code).isEmpty()) {
                return code;
            }
        }

        throw new IllegalStateException("Unable to generate a unique linking code.");
    }
}

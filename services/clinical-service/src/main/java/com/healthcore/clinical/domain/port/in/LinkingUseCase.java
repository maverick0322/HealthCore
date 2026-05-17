package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.LinkingCode;

public interface LinkingUseCase {
    LinkingCode generateLinkingCode(String nutritionistId);
    LinkingCode getCurrentLinkingCode(String nutritionistId);
    void linkPatient(String patientId, String code);
    void unlinkPatient(String patientId);
    void unlinkNutritionist(String nutritionistId, String patientId);
}
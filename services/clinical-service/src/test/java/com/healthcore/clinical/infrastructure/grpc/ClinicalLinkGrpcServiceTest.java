package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.grpc.ValidateLinkRequest;
import com.healthcore.clinical.grpc.ValidateLinkResponse;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClinicalLinkGrpcServiceTest {

    @Mock
    private ClinicalRepositoryPort clinicalRepositoryPort;

    @Mock
    private StreamObserver<ValidateLinkResponse> responseObserver;

    private ClinicalLinkGrpcService service;

    @BeforeEach
    void setUp() {
        service = new ClinicalLinkGrpcService(
                patientId -> clinicalRepositoryPort.findByUserId(patientId).map(PatientProfile::getNutritionistId)
        );
    }

    @Test
    void validateLink_shouldReturnTrueWhenPatientIsLinkedToNutritionist() {
        PatientProfile profile = patientProfile();
        profile.setNutritionistId("nutri-1");
        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(profile));

        service.validateLink(request("patient-1", "nutri-1"), responseObserver);

        assertResponseValidity(true);
    }

    @Test
    void validateLink_shouldReturnFalseWhenPatientHasNoNutritionist() {
        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(patientProfile()));

        service.validateLink(request("patient-1", "nutri-1"), responseObserver);

        assertResponseValidity(false);
    }

    @Test
    void validateLink_shouldReturnFalseWhenPatientBelongsToAnotherNutritionist() {
        PatientProfile profile = patientProfile();
        profile.setNutritionistId("nutri-2");
        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.of(profile));

        service.validateLink(request("patient-1", "nutri-1"), responseObserver);

        assertResponseValidity(false);
    }

    @Test
    void validateLink_shouldReturnFalseWhenPatientDoesNotExist() {
        when(clinicalRepositoryPort.findByUserId("patient-1")).thenReturn(Optional.empty());

        service.validateLink(request("patient-1", "nutri-1"), responseObserver);

        assertResponseValidity(false);
    }

    private ValidateLinkRequest request(String patientId, String nutritionistId) {
        return ValidateLinkRequest.newBuilder()
                .setPatientId(patientId)
                .setNutritionistId(nutritionistId)
                .build();
    }

    private PatientProfile patientProfile() {
        return new PatientProfile(
                "patient-1",
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                Gender.MALE,
                ActivityLevel.MODERATELY_ACTIVE,
                "health",
                "omnivore",
                List.of(),
                List.of()
        );
    }

    private void assertResponseValidity(boolean valid) {
        ArgumentCaptor<ValidateLinkResponse> captor = ArgumentCaptor.forClass(ValidateLinkResponse.class);
        verify(responseObserver).onNext(captor.capture());
        verify(responseObserver).onCompleted();
        assertThat(captor.getValue().getValid()).isEqualTo(valid);
    }
}

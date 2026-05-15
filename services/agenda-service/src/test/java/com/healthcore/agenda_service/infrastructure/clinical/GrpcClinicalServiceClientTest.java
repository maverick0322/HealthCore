package com.healthcore.agenda_service.infrastructure.clinical;

import com.healthcore.agenda_service.domain.exception.ClinicalServiceUnavailableException;
import com.healthcore.clinical.grpc.ClinicalLinkValidatorGrpc;
import com.healthcore.clinical.grpc.ValidateLinkRequest;
import com.healthcore.clinical.grpc.ValidateLinkResponse;
import io.grpc.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GrpcClinicalServiceClientTest {

    private ClinicalLinkValidatorGrpc.ClinicalLinkValidatorBlockingStub stub;
    private GrpcClinicalServiceClient client;

    @BeforeEach
    void setUp() {
        stub = mock(ClinicalLinkValidatorGrpc.ClinicalLinkValidatorBlockingStub.class);
        when(stub.withDeadlineAfter(3, TimeUnit.SECONDS)).thenReturn(stub);
        client = new GrpcClinicalServiceClient(stub);
    }

    @Test
    void validateLink_shouldReturnTrueWhenClinicalConfirmsLink() {
        when(stub.validateLink(request("patient-1", "nutri-1")))
                .thenReturn(ValidateLinkResponse.newBuilder().setValid(true).build());

        boolean result = client.validateLink("patient-1", "nutri-1");

        assertThat(result).isTrue();
    }

    @Test
    void validateLink_shouldReturnFalseWhenClinicalRejectsLink() {
        when(stub.validateLink(request("patient-1", "nutri-1")))
                .thenReturn(ValidateLinkResponse.newBuilder().setValid(false).build());

        boolean result = client.validateLink("patient-1", "nutri-1");

        assertThat(result).isFalse();
    }

    @Test
    void validateLink_shouldReturnFalseWhenClinicalReturnsNotFound() {
        when(stub.validateLink(any(ValidateLinkRequest.class)))
                .thenThrow(Status.NOT_FOUND.asRuntimeException());

        boolean result = client.validateLink("patient-1", "nutri-1");

        assertThat(result).isFalse();
    }

    @Test
    void validateLink_shouldFailClosedWhenClinicalIsUnavailable() {
        when(stub.validateLink(any(ValidateLinkRequest.class)))
                .thenThrow(Status.UNAVAILABLE.asRuntimeException());

        assertThatThrownBy(() -> client.validateLink("patient-1", "nutri-1"))
                .isInstanceOf(ClinicalServiceUnavailableException.class);
    }

    @Test
    void validateLink_shouldFailClosedWhenClinicalTimesOut() {
        when(stub.validateLink(any(ValidateLinkRequest.class)))
                .thenThrow(Status.DEADLINE_EXCEEDED.asRuntimeException());

        assertThatThrownBy(() -> client.validateLink("patient-1", "nutri-1"))
                .isInstanceOf(ClinicalServiceUnavailableException.class);
    }

    private ValidateLinkRequest request(String patientId, String nutritionistId) {
        return ValidateLinkRequest.newBuilder()
                .setPatientId(patientId)
                .setNutritionistId(nutritionistId)
                .build();
    }
}

package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.clinical.grpc.ClinicalLinkValidatorGrpc;
import com.healthcore.clinical.grpc.ValidateLinkRequest;
import com.healthcore.tracking.domain.exception.ClinicalServiceUnavailableException;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class GrpcClinicalServiceClient {

    private static final int GRPC_TIMEOUT_SECONDS = 3;

    private final ClinicalLinkValidatorGrpc.ClinicalLinkValidatorBlockingStub clinicalStub;
    private final ManagedChannel managedChannel;

    public GrpcClinicalServiceClient(@Value("${grpc.clinical.target:clinical-service:50051}") String grpcTarget) {
        log.info("Initializing gRPC client for Clinical Service at target: {}", grpcTarget);
        this.managedChannel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();
        this.clinicalStub = ClinicalLinkValidatorGrpc.newBlockingStub(managedChannel);
    }

    public boolean validateLink(String patientId, String nutritionistId) {
        try {
            ValidateLinkRequest request = ValidateLinkRequest.newBuilder()
                    .setPatientId(patientId)
                    .setNutritionistId(nutritionistId)
                    .build();

            return clinicalStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .validateLink(request)
                    .getValid();
        } catch (StatusRuntimeException ex) {
            if (ex.getStatus().getCode() == Status.Code.NOT_FOUND) {
                return false;
            }
            throw clinicalUnavailable(ex);
        } catch (Exception ex) {
            throw clinicalUnavailable(ex);
        }
    }

    @PreDestroy
    void shutdown() {
        managedChannel.shutdown();
    }

    private ClinicalServiceUnavailableException clinicalUnavailable(Exception ex) {
        log.warn("Clinical link validation failed", ex);
        return new ClinicalServiceUnavailableException(
                "No fue posible validar el vinculo clinico del paciente. Intenta nuevamente.",
                ex
        );
    }
}

package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.grpc.ClinicalLinkValidatorGrpc;
import com.healthcore.clinical.grpc.ValidateLinkRequest;
import com.healthcore.clinical.grpc.ValidateLinkResponse;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class ClinicalLinkGrpcService extends ClinicalLinkValidatorGrpc.ClinicalLinkValidatorImplBase {

    private final ClinicalRepositoryPort clinicalRepositoryPort;

    public ClinicalLinkGrpcService(ClinicalRepositoryPort clinicalRepositoryPort) {
        this.clinicalRepositoryPort = clinicalRepositoryPort;
    }

    @Override
    public void validateLink(
            ValidateLinkRequest request,
            StreamObserver<ValidateLinkResponse> responseObserver
    ) {
        boolean valid = clinicalRepositoryPort.findByUserId(request.getPatientId())
                .map(profile -> Objects.equals(profile.getNutritionistId(), request.getNutritionistId()))
                .orElse(false);

        responseObserver.onNext(ValidateLinkResponse.newBuilder().setValid(valid).build());
        responseObserver.onCompleted();
    }
}

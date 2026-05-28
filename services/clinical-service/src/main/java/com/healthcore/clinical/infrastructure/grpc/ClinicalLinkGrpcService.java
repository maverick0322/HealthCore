package com.healthcore.clinical.infrastructure.grpc;

import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

import com.healthcore.clinical.grpc.ClinicalLinkValidatorGrpc;
import com.healthcore.clinical.grpc.ValidateLinkRequest;
import com.healthcore.clinical.grpc.ValidateLinkResponse;

import io.grpc.stub.StreamObserver;

public class ClinicalLinkGrpcService extends ClinicalLinkValidatorGrpc.ClinicalLinkValidatorImplBase {

    private final Function<String, Optional<String>> nutritionistLookup;

    public ClinicalLinkGrpcService(Function<String, Optional<String>> nutritionistLookup) {
        this.nutritionistLookup = nutritionistLookup;
    }

    @Override
    public void validateLink(
            ValidateLinkRequest request,
            StreamObserver<ValidateLinkResponse> responseObserver
    ) {
        boolean valid = nutritionistLookup.apply(request.getPatientId())
                .map(nutritionistId -> Objects.equals(nutritionistId, request.getNutritionistId()))
                .orElse(false);

        responseObserver.onNext(ValidateLinkResponse.newBuilder().setValid(valid).build());
        responseObserver.onCompleted();
    }
}

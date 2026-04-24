package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.exception.ServiceUnavailableException;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
public class CatalogGrpcClientAdapter implements FoodCatalogPort {

    private final NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    @Autowired
    public CatalogGrpcClientAdapter(@Value("${grpc.catalog.target:localhost:50051}") String grpcTarget) {
        log.info("Initializing gRPC client for Catalog Service at: {}", grpcTarget);

        ManagedChannel channel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();

        this.catalogStub = NutritionalCatalogGrpc.newBlockingStub(channel);
    }

    public CatalogGrpcClientAdapter(NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub) {
        this.catalogStub = catalogStub;
    }

    @Override
    public Optional<FoodNutrients> getNutrientsByBarcode(String barcode) {
        try {
            log.debug("Fetching macros from Python service for barcode: {}", barcode);

            FoodRequest request = FoodRequest.newBuilder()
                    .setBarcode(barcode)
                    .build();

            FoodResponse response = catalogStub.getFoodItem(request);

            return Optional.of(FoodNutrients.builder()
                    .name(response.getName())
                    .brand(response.getBrand())
                    .calories(response.getCaloriesPer100G())
                    .proteins(response.getProteinsPer100G())
                    .carbohydrates(response.getCarbsPer100G())
                    .fats(response.getFatsPer100G())
                    .source(response.getSource())
                    .build());

        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
                log.debug("Food with barcode {} not found in Catalog Service", barcode);
                return Optional.empty();
            }

            log.error("Critical communication error with Catalog Service for barcode {}. Status: {}", barcode, e.getStatus().getCode());
            throw new ServiceUnavailableException("Catalog Service is currently unavailable. Please try again later.");
        }
    }
}
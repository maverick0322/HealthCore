package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.model.FoodNutrients;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
public class CatalogGrpcClientAdapter implements FoodCatalogPort {

    private final NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    public CatalogGrpcClientAdapter(@Value("${grpc.catalog.target:localhost:50051}") String grpcTarget) {
        log.info("Initializing gRPC client for Catalog Service at: {}", grpcTarget);

        ManagedChannel channel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext() // Fine for dev, should be TLS for prod
                .build();

        this.catalogStub = NutritionalCatalogGrpc.newBlockingStub(channel);
    }

    @Override
    public Optional<FoodNutrients> getNutrientsByBarcode(String barcode) {
        try {
            log.debug("Fetching macros from Python service for barcode: {}", barcode);

            FoodRequest request = FoodRequest.newBuilder()
                    .setBarcode(barcode)
                    .build();

            FoodResponse response = catalogStub.getFoodItem(request);

            // We map the gRPC response to our internal Domain model
            return Optional.of(FoodNutrients.builder()
                    .name(response.getName())
                    .brand(response.getBrand())
                    .calories(response.getCaloriesPer100G())
                    .source(response.getSource())
                    .build());

        } catch (StatusRuntimeException e) {
            log.error("gRPC call failed for barcode {}: {}", barcode, e.getStatus());
            return Optional.empty();
        }
    }
}
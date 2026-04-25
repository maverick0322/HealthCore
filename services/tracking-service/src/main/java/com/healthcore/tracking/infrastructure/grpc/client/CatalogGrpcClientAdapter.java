package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.SearchRequest;
import com.healthcore.catalog.grpc.SearchResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
            FoodRequest request = FoodRequest.newBuilder().setBarcode(barcode).build();
            FoodResponse response = catalogStub.getFoodItem(request);
            
            return Optional.of(FoodNutrients.builder()
                    .barcode(response.getBarcode().isEmpty() ? barcode : response.getBarcode()) // Por seguridad, si viene vacío usamos el argumento
                    .name(response.getName())
                    .brand(response.getBrand())
                    .imageUrl(response.getImageUrl())
                    .calories(response.getCaloriesPer100G())
                    .proteins(response.getProteinsPer100G())
                    .carbohydrates(response.getCarbsPer100G())
                    .fats(response.getFatsPer100G())
                    .source(response.getSource())
                    .build());
        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
                return Optional.empty();
            }
            throw new ExternalCatalogUnavailableException("Catalog Service is currently unavailable.");
        }
    }

    @Override
    public List<FoodNutrients> searchFoodByName(String query) {
        try {
            log.debug("Searching foods in Python service for query: {}", query);

            SearchRequest request = SearchRequest.newBuilder()
                    .setQuery(query)
                    .build();

            SearchResponse response = catalogStub.searchFood(request);

            return response.getItemsList().stream().map(grpcItem -> FoodNutrients.builder()
                    .barcode(grpcItem.getBarcode())
                    .name(grpcItem.getName())
                    .brand(grpcItem.getBrand())
                    .imageUrl(grpcItem.getImageUrl())
                    .calories(grpcItem.getCaloriesPer100G())
                    .proteins(grpcItem.getProteinsPer100G())
                    .carbohydrates(grpcItem.getCarbsPer100G())
                    .fats(grpcItem.getFatsPer100G())
                    .source(grpcItem.getSource())
                    .build()
            ).collect(Collectors.toList());

        } catch (StatusRuntimeException e) {
            log.error("Error connecting to Python for search. Query: {}, Status: {}", query, e.getStatus().getCode());
            return Collections.emptyList();
        }
    }
}
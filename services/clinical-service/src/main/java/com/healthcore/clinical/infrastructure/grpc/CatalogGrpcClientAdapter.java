package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.catalog.grpc.SearchRequest;
import com.healthcore.catalog.grpc.SearchResponse;
import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.port.out.NutritionCatalogPort;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Component
public class CatalogGrpcClientAdapter implements NutritionCatalogPort {

    private static final int GRPC_TIMEOUT_SECONDS = 5;

    private final NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    public CatalogGrpcClientAdapter(@Value("${grpc.catalog.target:localhost:50051}") String grpcTarget) {
        ManagedChannel channel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();
        this.catalogStub = NutritionalCatalogGrpc.newBlockingStub(channel);
    }

    public CatalogGrpcClientAdapter(NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub) {
        this.catalogStub = catalogStub;
    }

    @Override
    public Optional<CatalogFoodItem> getFoodByBarcode(String barcode) {
        try {
            FoodResponse response = catalogStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .getFoodItem(FoodRequest.newBuilder().setBarcode(barcode).build());
            return Optional.of(mapToDomain(response, barcode));
        } catch (StatusRuntimeException exception) {
            if (exception.getStatus().getCode() == Status.Code.NOT_FOUND) {
                return Optional.empty();
            }
            throw translateException(exception);
        }
    }

    @Override
    public List<CatalogFoodItem> searchFoods(String query) {
        try {
            SearchResponse response = catalogStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .searchFood(SearchRequest.newBuilder().setQuery(query).build());
            return response.getItemsList().stream()
                    .map(item -> mapToDomain(item, item.getBarcode()))
                    .toList();
        } catch (StatusRuntimeException exception) {
            if (exception.getStatus().getCode() == Status.Code.NOT_FOUND) {
                return Collections.emptyList();
            }
            throw translateException(exception);
        }
    }

    private CatalogFoodItem mapToDomain(FoodResponse response, String requestedBarcode) {
        String finalBarcode = response.getBarcode().isBlank() ? requestedBarcode : response.getBarcode();
        return new CatalogFoodItem(
                finalBarcode,
                response.getName(),
                response.getBrand(),
                response.getImageUrl(),
                response.getCaloriesPer100G(),
                response.getProteinsPer100G(),
                response.getCarbsPer100G(),
                response.getFatsPer100G()
        );
    }

    private RuntimeException translateException(StatusRuntimeException exception) {
        if (exception.getStatus().getCode() == Status.Code.INVALID_ARGUMENT) {
            return new IllegalArgumentException("Catalog service rejected the provided query.");
        }
        return new IllegalStateException("Catalog service is currently unavailable.");
    }
}

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Component
public class CatalogGrpcClientAdapter implements NutritionCatalogPort {

    private static final int GRPC_TIMEOUT_SECONDS = 5;
    private static final Logger logger = LoggerFactory.getLogger(CatalogGrpcClientAdapter.class);

    private final NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    @Autowired
    public CatalogGrpcClientAdapter(@Value("${grpc.catalog.target:localhost:50051}") String grpcTarget) {
        ManagedChannel channel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();
        this.catalogStub = NutritionalCatalogGrpc.newBlockingStub(channel);
    }

    CatalogGrpcClientAdapter(NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub) {
        this.catalogStub = catalogStub;
    }

    @Override
    public Optional<CatalogFoodItem> getFoodByBarcode(String barcode) {
        try {
            logger.debug("[CatalogGrpcClientAdapter] Requesting food by barcode={}", barcode);
            FoodResponse response = catalogStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .getFoodItem(FoodRequest.newBuilder().setBarcode(barcode).build());
            return Optional.of(mapToDomain(response, barcode));
        } catch (StatusRuntimeException exception) {
            if (exception.getStatus().getCode() == Status.Code.NOT_FOUND) {
                logger.warn("[CatalogGrpcClientAdapter] Food not found for barcode={}", barcode);
                return Optional.empty();
            }
            logger.error("[CatalogGrpcClientAdapter] Error fetching barcode={} status={}",
                    barcode, exception.getStatus(), exception);
            throw translateException(exception);
        }
    }

    @Override
    public List<CatalogFoodItem> searchFoods(String query) {
        try {
            logger.debug("[CatalogGrpcClientAdapter] Searching foods query='{}'", query);
            SearchResponse response = catalogStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .searchFood(SearchRequest.newBuilder().setQuery(query).build());
            return response.getItemsList().stream()
                    .map(item -> mapToDomain(item, item.getBarcode()))
                    .toList();
        } catch (StatusRuntimeException exception) {
            if (exception.getStatus().getCode() == Status.Code.NOT_FOUND) {
                logger.warn("[CatalogGrpcClientAdapter] No foods found for query='{}'", query);
                return Collections.emptyList();
            }
            logger.error("[CatalogGrpcClientAdapter] Error searching query='{}' status={}",
                    query, exception.getStatus(), exception);
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

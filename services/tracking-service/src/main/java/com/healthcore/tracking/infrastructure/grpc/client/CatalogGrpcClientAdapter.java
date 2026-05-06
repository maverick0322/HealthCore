package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.SearchRequest;
import com.healthcore.catalog.grpc.SearchResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.FoodNutrients;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Driven Adapter (Infrastructure): Translates gRPC network communication into Domain concepts.
 */
@Slf4j
@Component
public class CatalogGrpcClientAdapter implements FoodCatalogPort {

    private static final int GRPC_TIMEOUT_SECONDS = 5;

    private final NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    @Autowired
    public CatalogGrpcClientAdapter(@Value("${grpc.catalog.target:localhost:50051}") String grpcTarget) {
        log.info("Initializing gRPC client for Catalog Service at target: {}", grpcTarget);
        ManagedChannel channel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();
        this.catalogStub = NutritionalCatalogGrpc.newBlockingStub(channel);
    }

    public CatalogGrpcClientAdapter(NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub) {
        this.catalogStub = catalogStub;
    }

    @Override
    @Cacheable(value = "foodNutrients", key = "#barcode", unless = "#result == null")
    public Optional<FoodNutrients> getNutrientsByBarcode(String barcode) {
        try {
            log.debug("Initiating gRPC call to fetch nutrients for barcode: {}", barcode);
            FoodRequest request = FoodRequest.newBuilder().setBarcode(barcode).build();
            FoodResponse response = catalogStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .getFoodItem(request);

            return Optional.of(mapToDomain(response, barcode));

        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
                return Optional.empty();
            }
            throw translateGrpcException(e, "getNutrientsByBarcode");
        } catch (Exception e) {
            log.error("Unexpected critical error during gRPC getNutrientsByBarcode call.", e);
            throw new ExternalCatalogUnavailableException("Unexpected error communicating with the Catalog service.");
        }
    }

    @Override
    @Cacheable(value = "foodSearch", key = "#query", unless = "#result.isEmpty()")
    public List<FoodNutrients> searchFoodByName(String query) {
        try {
            log.debug("Initiating gRPC call to search food by name: {}", query);
            SearchRequest request = SearchRequest.newBuilder().setQuery(query).build();
            SearchResponse response = catalogStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .searchFood(request);

            return response.getItemsList().stream()
                    .map(grpcItem -> mapToDomain(grpcItem, grpcItem.getBarcode()))
                    .collect(Collectors.toList());

        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
                return Collections.emptyList();
            }
            throw translateGrpcException(e, "searchFoodByName");
        } catch (Exception e) {
            log.error("Unexpected critical error during gRPC searchFoodByName call.", e);
            throw new ExternalCatalogUnavailableException("Unexpected error communicating with the Catalog service.");
        }
    }

    private FoodNutrients mapToDomain(FoodResponse response, String requestedBarcode) {
        String finalBarcode = response.getBarcode().isEmpty() ? requestedBarcode : response.getBarcode();

        return new FoodNutrients(
                finalBarcode,
                response.getName(),
                response.getBrand(),
                response.getImageUrl(),
                response.getCaloriesPer100G(),
                response.getProteinsPer100G(),
                response.getCarbsPer100G(),
                response.getFatsPer100G(),
                response.getFiberGramsPer100G(),
                response.getSodiumMgPer100G(),
                response.getSugarGramsPer100G(),
                response.getPotassiumMgPer100G()
        );
    }

    private RuntimeException translateGrpcException(StatusRuntimeException e, String operation) {
        Status.Code code = e.getStatus().getCode();
        log.warn("gRPC operation [{}] failed with status: {}", operation, code);

        if (code == Status.Code.INVALID_ARGUMENT) {
            return new InvalidDomainDataException("Catalog Service rejected the input data format.");
        } else if (code == Status.Code.DEADLINE_EXCEEDED) {
            return new ExternalCatalogUnavailableException("Catalog Service timed out after " + GRPC_TIMEOUT_SECONDS + " seconds.");
        } else {
            return new ExternalCatalogUnavailableException("The Catalog Service is currently unreachable or failed internally.");
        }
    }
}
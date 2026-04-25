package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException;
import com.healthcore.tracking.domain.model.FoodNutrients;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogGrpcClientAdapterTest {

    @Mock
    private NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStubMock;

    private CatalogGrpcClientAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new CatalogGrpcClientAdapter(catalogStubMock);
    }

    @Test
    void should_ReturnFoodNutrients_When_GrpcCallIsSuccessful() {
        // Arrange
        FoodResponse mockResponse = FoodResponse.newBuilder()
                .setName("Manzana Fresca")
                .setBrand("Local")
                .setCaloriesPer100G(52)
                .setSource("USDA")
                .build();

        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenReturn(mockResponse);

        // Act
        Optional<FoodNutrients> result = adapter.getNutrientsByBarcode("12345");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Manzana Fresca", result.get().getName());
        assertEquals(52.0, result.get().getCalories());
    }

    @Test
    void should_ReturnEmptyOptional_When_GrpcReturnsNotFound() {
        // Arrange
        StatusRuntimeException notFoundException = new StatusRuntimeException(Status.NOT_FOUND);
        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenThrow(notFoundException);

        // Act
        Optional<FoodNutrients> result = adapter.getNutrientsByBarcode("99999");

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    void should_ThrowServiceUnavailableException_When_GrpcReturnsUnavailable() {
        // Arrange
        StatusRuntimeException unavailableException = new StatusRuntimeException(Status.UNAVAILABLE);
        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenThrow(unavailableException);

        // Act & Assert
        assertThrows(ExternalCatalogUnavailableException.class, () -> {
            adapter.getNutrientsByBarcode("12345");
        });
    }
}
package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.SearchRequest;
import com.healthcore.catalog.grpc.SearchResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.FoodNutrients;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogGrpcClientAdapterTest {

    @Mock
    private NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStubMock;

    private CatalogGrpcClientAdapter adapter;

    @BeforeEach
    void setUp() {
        when(catalogStubMock.withDeadlineAfter(anyLong(), any(TimeUnit.class))).thenReturn(catalogStubMock);

        adapter = new CatalogGrpcClientAdapter(catalogStubMock);
    }

    @Test
    @DisplayName("Should map and return FoodNutrients including new micronutrients when gRPC call is successful")
    void getNutrientsByBarcode_Success() {
        // Arrange
        FoodResponse mockResponse = FoodResponse.newBuilder()
                .setBarcode("12345")
                .setName("Manzana Fresca")
                .setBrand("Local")
                .setCaloriesPer100G(52.0F)
                .setProteinsPer100G(0.3F)
                .setFiberGramsPer100G(2.4F)      // New Micro
                .setSodiumMgPer100G(1.0F)        // New Micro
                .setSugarGramsPer100G(10.0F)     // New Micro
                .setPotassiumMgPer100G(107.0F)   // New Micro
                .build();

        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenReturn(mockResponse);

        // Act
        Optional<FoodNutrients> result = adapter.getNutrientsByBarcode("12345");

        // Assert
        assertTrue(result.isPresent());
        FoodNutrients nutrients = result.get();
        assertEquals("Manzana Fresca", nutrients.name());
        assertEquals("Local", nutrients.brand());
        assertEquals(52.0, nutrients.calories(), 0.001);

        // Assert new micronutrients mapping
        assertEquals(2.4, nutrients.fiberGrams(), 0.001);
        assertEquals(1.0, nutrients.sodiumMg(), 0.001);
        assertEquals(10.0, nutrients.sugarGrams(), 0.001);
        assertEquals(107.0, nutrients.potassiumMg(), 0.001);
    }

    @Test
    @DisplayName("Should return empty Optional when gRPC status is NOT_FOUND")
    void getNutrientsByBarcode_ReturnsEmptyOnNotFound() {
        // Arrange
        StatusRuntimeException notFoundException = new StatusRuntimeException(Status.NOT_FOUND);
        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenThrow(notFoundException);

        // Act
        Optional<FoodNutrients> result = adapter.getNutrientsByBarcode("99999");

        // Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should throw InvalidDomainDataException when gRPC status is INVALID_ARGUMENT")
    void getNutrientsByBarcode_ThrowsInvalidDomainDataOnInvalidArgument() {
        // Arrange
        StatusRuntimeException invalidException = new StatusRuntimeException(Status.INVALID_ARGUMENT);
        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenThrow(invalidException);

        // Act & Assert
        assertThrows(InvalidDomainDataException.class, () -> adapter.getNutrientsByBarcode("  "));
    }

    @Test
    @DisplayName("Should throw ExternalCatalogUnavailableException on timeout (DEADLINE_EXCEEDED)")
    void getNutrientsByBarcode_ThrowsUnavailableOnTimeout() {
        // Arrange
        StatusRuntimeException timeoutException = new StatusRuntimeException(Status.DEADLINE_EXCEEDED);
        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenThrow(timeoutException);

        // Act & Assert
        ExternalCatalogUnavailableException ex = assertThrows(ExternalCatalogUnavailableException.class,
                () -> adapter.getNutrientsByBarcode("12345"));
        assertTrue(ex.getMessage().contains("timed out"));
    }

    @Test
    @DisplayName("Should throw ExternalCatalogUnavailableException on generic unexpected Exception")
    void getNutrientsByBarcode_ThrowsUnavailableOnGenericException() {
        // Arrange
        when(catalogStubMock.getFoodItem(any(FoodRequest.class))).thenThrow(new RuntimeException("Server on fire"));

        // Act & Assert
        assertThrows(ExternalCatalogUnavailableException.class, () -> adapter.getNutrientsByBarcode("12345"));
    }

    @Test
    @DisplayName("Should return mapped list of FoodNutrients on successful search")
    void searchFoodByName_Success() {
        // Arrange
        FoodResponse item1 = FoodResponse.newBuilder().setBarcode("111").setName("Oreo").build();
        FoodResponse item2 = FoodResponse.newBuilder().setBarcode("222").setName("Oreo Mini").build();

        SearchResponse mockResponse = SearchResponse.newBuilder()
                .addItems(item1)
                .addItems(item2)
                .build();

        when(catalogStubMock.searchFood(any(SearchRequest.class))).thenReturn(mockResponse);

        // Act
        List<FoodNutrients> results = adapter.searchFoodByName("Oreo");

        // Assert
        assertEquals(2, results.size());
        assertEquals("Oreo", results.get(0).name());
        assertEquals("Oreo Mini", results.get(1).name());
    }

    @Test
    @DisplayName("Should return empty list when gRPC search returns NOT_FOUND")
    void searchFoodByName_ReturnsEmptyListOnNotFound() {
        // Arrange
        StatusRuntimeException notFoundException = new StatusRuntimeException(Status.NOT_FOUND);
        when(catalogStubMock.searchFood(any(SearchRequest.class))).thenThrow(notFoundException);

        // Act
        List<FoodNutrients> results = adapter.searchFoodByName("GhostProduct");

        // Assert
        assertTrue(results.isEmpty());
    }
}
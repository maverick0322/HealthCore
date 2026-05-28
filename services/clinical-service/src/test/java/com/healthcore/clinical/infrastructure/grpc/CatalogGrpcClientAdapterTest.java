package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import com.healthcore.catalog.grpc.SearchRequest;
import com.healthcore.catalog.grpc.SearchResponse;
import com.healthcore.clinical.domain.model.CatalogFoodItem;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogGrpcClientAdapterTest {

    @Mock
    private NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    @Mock
    private NutritionalCatalogGrpc.NutritionalCatalogBlockingStub deadlineStub;

    @Test
    void shouldReturnMappedFoodAndFallbackToRequestedBarcodeWhenResponseBarcodeIsBlank() {
        CatalogGrpcClientAdapter adapter = new CatalogGrpcClientAdapter(catalogStub);
        FoodResponse response = FoodResponse.newBuilder()
                .setName("Rolled Oats")
                .setBrand("HealthCore")
                .setImageUrl("https://cdn.example/oats.png")
                .setCaloriesPer100G(389)
                .setProteinsPer100G(17)
                .setCarbsPer100G(66)
                .setFatsPer100G(7)
                .build();

        when(catalogStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getFoodItem(any(FoodRequest.class))).thenReturn(response);

        Optional<CatalogFoodItem> result = adapter.getFoodByBarcode("7501234567890");

        assertTrue(result.isPresent());
        assertEquals("7501234567890", result.get().barcode());
        assertEquals("Rolled Oats", result.get().name());
        assertEquals("HealthCore", result.get().brand());

        ArgumentCaptor<FoodRequest> requestCaptor = ArgumentCaptor.forClass(FoodRequest.class);
        verify(deadlineStub).getFoodItem(requestCaptor.capture());
        assertEquals("7501234567890", requestCaptor.getValue().getBarcode());
    }

    @Test
    void shouldReturnEmptyWhenCatalogReportsFoodNotFound() {
        CatalogGrpcClientAdapter adapter = new CatalogGrpcClientAdapter(catalogStub);

        when(catalogStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getFoodItem(any(FoodRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.NOT_FOUND));

        Optional<CatalogFoodItem> result = adapter.getFoodByBarcode("7501234567890");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldTranslateInvalidArgumentWhenCatalogRejectsBarcodeLookup() {
        CatalogGrpcClientAdapter adapter = new CatalogGrpcClientAdapter(catalogStub);

        when(catalogStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getFoodItem(any(FoodRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.INVALID_ARGUMENT));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> adapter.getFoodByBarcode("invalid")
        );

        assertEquals("Catalog service rejected the provided query.", exception.getMessage());
    }

    @Test
    void shouldReturnMappedSearchResults() {
        CatalogGrpcClientAdapter adapter = new CatalogGrpcClientAdapter(catalogStub);
        SearchResponse response = SearchResponse.newBuilder()
                .addItems(FoodResponse.newBuilder()
                        .setBarcode("7501111111111")
                        .setName("Greek Yogurt")
                        .setBrand("Brand A")
                        .setImageUrl("https://cdn.example/yogurt.png")
                        .setCaloriesPer100G(59)
                        .setProteinsPer100G(10)
                        .setCarbsPer100G(3)
                        .setFatsPer100G(0)
                        .build())
                .addItems(FoodResponse.newBuilder()
                        .setBarcode("7502222222222")
                        .setName("Blueberries")
                        .setBrand("Brand B")
                        .setImageUrl("https://cdn.example/blueberries.png")
                        .setCaloriesPer100G(57)
                        .setProteinsPer100G(1)
                        .setCarbsPer100G(14)
                        .setFatsPer100G(0)
                        .build())
                .build();

        when(catalogStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.searchFood(any(SearchRequest.class))).thenReturn(response);

        List<CatalogFoodItem> result = adapter.searchFoods("berries");

        assertEquals(2, result.size());
        assertIterableEquals(
                List.of("7501111111111", "7502222222222"),
                result.stream().map(CatalogFoodItem::barcode).toList()
        );

        ArgumentCaptor<SearchRequest> requestCaptor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(deadlineStub).searchFood(requestCaptor.capture());
        assertEquals("berries", requestCaptor.getValue().getQuery());
    }

    @Test
    void shouldReturnEmptyListWhenCatalogReportsNoSearchResults() {
        CatalogGrpcClientAdapter adapter = new CatalogGrpcClientAdapter(catalogStub);

        when(catalogStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.searchFood(any(SearchRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.NOT_FOUND));

        List<CatalogFoodItem> result = adapter.searchFoods("berries");

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldTranslateUnexpectedSearchFailureToUnavailableState() {
        CatalogGrpcClientAdapter adapter = new CatalogGrpcClientAdapter(catalogStub);

        when(catalogStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.searchFood(any(SearchRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.UNAVAILABLE));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> adapter.searchFoods("berries")
        );

        assertEquals("Catalog service is currently unavailable.", exception.getMessage());
    }
}

package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.domain.exception.NotFoundException;
import com.healthcore.tracking.domain.port.FoodCatalogPort;
import com.healthcore.tracking.domain.model.FoodNutrients;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = FoodTrackingController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
class FoodTrackingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FoodCatalogPort catalogPort;

    @Test
    void should_Return200Ok_And_Nutrients_When_BarcodeIsFound() throws Exception {
        // Arrange
        FoodNutrients mockNutrients = FoodNutrients.builder()
                .name("Avena Integral")
                .brand("Quaker")
                .calories(389.0)
                .source("USDA")
                .build();

        when(catalogPort.getNutrientsByBarcode("75017618"))
                .thenReturn(Optional.of(mockNutrients));

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/catalog/75017618")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.name").value("Avena Integral"))
                .andExpect(jsonPath("$.data.calories").value(389.0));
    }

    @Test
    void should_ThrowNotFoundException_When_BarcodeDoesNotExist() throws Exception {
        // Arrange
        when(catalogPort.getNutrientsByBarcode(anyString()))
                .thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/v1/tracking/catalog/000000000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Food item not found in catalog"));
    }
}
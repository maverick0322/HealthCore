package com.healthcore.tracking.domain.port;

import java.util.List;
import java.util.Optional;
import com.healthcore.tracking.domain.model.FoodNutrients;

/**
 * Outbound Port (Driven Adapter interface) to communicate with external food catalogs.
 * Follows Dependency Inversion Principle (DIP).
 */
public interface FoodCatalogPort {

    /**
     * Retrieves base nutritional information for a specific barcode.
     * * @param barcode The unique product identifier.
     * @return Optional containing FoodNutrients if found, empty otherwise.
     * @throws com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException if upstream fails.
     */
    Optional<FoodNutrients> getNutrientsByBarcode(String barcode);

    /**
     * Searches for food items using a free-text query.
     * * @param query The text to search for.
     * @return List of matched products (can be empty).
     * @throws com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException if upstream fails.
     */
    List<FoodNutrients> searchFoodByName(String query);
}
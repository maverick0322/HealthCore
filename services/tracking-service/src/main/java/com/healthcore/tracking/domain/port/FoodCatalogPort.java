package com.healthcore.tracking.domain.port;

import java.util.List;
import java.util.Optional;
import com.healthcore.tracking.domain.model.FoodNutrients;

public interface FoodCatalogPort {
    Optional<FoodNutrients> getNutrientsByBarcode(String barcode);

    List<FoodNutrients> searchFoodByName(String query);
}
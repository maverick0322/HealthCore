package com.healthcore.tracking.domain.port;

import java.util.Optional;
import com.healthcore.tracking.domain.model.FoodNutrients;

public interface FoodCatalogPort {
    Optional<FoodNutrients> getNutrientsByBarcode(String barcode);
}
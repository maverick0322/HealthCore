package com.healthcore.clinical.domain.port.out;

import com.healthcore.clinical.domain.model.CatalogFoodItem;

import java.util.List;
import java.util.Optional;

public interface NutritionCatalogPort {
    Optional<CatalogFoodItem> getFoodByBarcode(String barcode);
    List<CatalogFoodItem> searchFoods(String query);
}

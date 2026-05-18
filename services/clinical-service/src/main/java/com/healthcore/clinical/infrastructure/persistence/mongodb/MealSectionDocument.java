package com.healthcore.clinical.infrastructure.persistence.mongodb;

import java.util.List;

public class MealSectionDocument {
    private String mealSlot;
    private List<MealOptionDocument> options;

    public String getMealSlot() {
        return mealSlot;
    }

    public void setMealSlot(String mealSlot) {
        this.mealSlot = mealSlot;
    }

    public List<MealOptionDocument> getOptions() {
        return options;
    }

    public void setOptions(List<MealOptionDocument> options) {
        this.options = options;
    }
}

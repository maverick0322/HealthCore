package com.healthcore.clinical.infrastructure.persistence.mongodb;

public class PlanIngredientDocument {
    private String barcode;
    private String name;
    private String brand;
    private String imageUrl;
    private String unit;
    private double quantityAmount;
    private int calories;
    private int proteinGrams;
    private int carbsGrams;
    private int fatGrams;

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public double getQuantityAmount() {
        return quantityAmount;
    }

    public void setQuantityAmount(double quantityAmount) {
        this.quantityAmount = quantityAmount;
    }

    public int getCalories() {
        return calories;
    }

    public void setCalories(int calories) {
        this.calories = calories;
    }

    public int getProteinGrams() {
        return proteinGrams;
    }

    public void setProteinGrams(int proteinGrams) {
        this.proteinGrams = proteinGrams;
    }

    public int getCarbsGrams() {
        return carbsGrams;
    }

    public void setCarbsGrams(int carbsGrams) {
        this.carbsGrams = carbsGrams;
    }

    public int getFatGrams() {
        return fatGrams;
    }

    public void setFatGrams(int fatGrams) {
        this.fatGrams = fatGrams;
    }
}

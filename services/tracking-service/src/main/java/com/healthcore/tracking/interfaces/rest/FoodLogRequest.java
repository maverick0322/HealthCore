package com.healthcore.tracking.interfaces.rest;

import lombok.Data;

@Data
public class FoodLogRequest {
    private String barcode;
    private double grams;
}
package com.healthcore.clinical.infrastructure.persistence.mongodb;

public class DailyGoalsSnapshotDocument {
    private Integer targetCalories;
    private Integer targetProtein;
    private Integer targetCarbs;
    private Integer targetFat;
    private Integer targetWaterGlasses;

    public Integer getTargetCalories() {
        return targetCalories;
    }

    public void setTargetCalories(Integer targetCalories) {
        this.targetCalories = targetCalories;
    }

    public Integer getTargetProtein() {
        return targetProtein;
    }

    public void setTargetProtein(Integer targetProtein) {
        this.targetProtein = targetProtein;
    }

    public Integer getTargetCarbs() {
        return targetCarbs;
    }

    public void setTargetCarbs(Integer targetCarbs) {
        this.targetCarbs = targetCarbs;
    }

    public Integer getTargetFat() {
        return targetFat;
    }

    public void setTargetFat(Integer targetFat) {
        this.targetFat = targetFat;
    }

    public Integer getTargetWaterGlasses() {
        return targetWaterGlasses;
    }

    public void setTargetWaterGlasses(Integer targetWaterGlasses) {
        this.targetWaterGlasses = targetWaterGlasses;
    }
}

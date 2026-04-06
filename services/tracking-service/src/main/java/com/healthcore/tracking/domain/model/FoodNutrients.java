package com.healthcore.tracking.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // Lombok: Genera getters, setters, toString, equals y hashCode
@Builder // Patrón Builder para facilitar la creación del objeto en el Adaptador
@NoArgsConstructor
@AllArgsConstructor
public class FoodNutrients {

    private String name;
    private String brand;
    private double calories; // Usamos double para mayor precisión en los macronutrientes
    private String source;

    // Si en el futuro el servicio de Python te devuelve más datos (proteínas, carbohidratos, grasas),
    // simplemente los agregas aquí y actualizas el Adaptador. ¡El resto de tu app no se rompe!
}
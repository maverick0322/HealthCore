package com.healthcore.tracking.controller;

import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.tracking.service.CatalogGrpcClientService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tracking")
public class TestIntegrationController {

    private final CatalogGrpcClientService catalogClient;

    public TestIntegrationController(CatalogGrpcClientService catalogClient) {
        this.catalogClient = catalogClient;
    }

    @GetMapping("/test-grpc/{barcode}")
    public Map<String, Object> testGrpcConnection(@PathVariable String barcode) {
        // Java le pide a Python los datos por gRPC
        FoodResponse response = catalogClient.getFoodMacros(barcode);

        // Traducimos la respuesta binaria a un JSON normal para que lo puedas leer
        return Map.of(
                "mensaje", "¡Conexión gRPC Java -> Python exitosa!",
                "producto", response.getName(),
                "marca", response.getBrand(),
                "calorias", response.getCaloriesPer100G(),
                "origen", response.getSource()
        );
    }
}
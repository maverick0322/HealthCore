package com.healthcore.tracking.service;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.stereotype.Service;

@Service
public class CatalogGrpcClientService {

    private final NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    public CatalogGrpcClientService() {
        // 1. Abrimos un tubo directo y ultrarrápido hacia el microservicio de Python
        ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 50051)
                .usePlaintext() // Sin encriptación por ahora, es tráfico interno
                .build();

        // 2. Creamos el "Stub" (nuestro cliente autogenerado)
        this.catalogStub = NutritionalCatalogGrpc.newBlockingStub(channel);
    }

    public FoodResponse getFoodMacros(String barcode) {
        // 3. Empacamos el código de barras en el formato binario de gRPC
        FoodRequest request = FoodRequest.newBuilder()
                .setBarcode(barcode)
                .build();

        // 4. ¡Disparamos la petición a Python y recibimos la respuesta al instante!
        return catalogStub.getFoodItem(request);
    }
}
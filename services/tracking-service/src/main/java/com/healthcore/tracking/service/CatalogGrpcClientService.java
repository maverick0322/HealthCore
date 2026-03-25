package com.healthcore.tracking.service;

import com.healthcore.catalog.grpc.FoodRequest;
import com.healthcore.catalog.grpc.FoodResponse;
import com.healthcore.catalog.grpc.NutritionalCatalogGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CatalogGrpcClientService {

    private final NutritionalCatalogGrpc.NutritionalCatalogBlockingStub catalogStub;

    public CatalogGrpcClientService(@Value("${grpc.catalog.target:localhost:50051}") String grpcTarget) {

        ManagedChannel channel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();

        this.catalogStub = NutritionalCatalogGrpc.newBlockingStub(channel);
    }

    public FoodResponse getFoodMacros(String barcode) {
        FoodRequest request = FoodRequest.newBuilder()
                .setBarcode(barcode)
                .build();

        return catalogStub.getFoodItem(request);
    }
}
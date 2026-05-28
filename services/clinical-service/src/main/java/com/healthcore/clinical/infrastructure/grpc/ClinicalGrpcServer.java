package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

@Component
public class ClinicalGrpcServer implements SmartLifecycle {

    private final ClinicalLinkGrpcService clinicalLinkGrpcService;
    private final int port;
    private Server server;
    private boolean running;

    public ClinicalGrpcServer(
            ClinicalRepositoryPort clinicalRepositoryPort,
            @Value("${grpc.clinical.port:50051}") int port
    ) {
        this.clinicalLinkGrpcService = new ClinicalLinkGrpcService(
                patientId -> clinicalRepositoryPort.findByUserId(patientId).map(profile -> profile.getNutritionistId())
        );
        this.port = port;
    }

    @Override
    public void start() {
        if (running) {
            return;
        }
        server = ServerBuilder.forPort(port)
                .addService(clinicalLinkGrpcService)
                .build();
        try {
            server.start();
            running = true;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to start Clinical gRPC server", ex);
        }
    }

    @Override
    public void stop() {
        if (server != null) {
            server.shutdown();
        }
        running = false;
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    @Override
    public int getPhase() {
        return Integer.MIN_VALUE;
    }
}

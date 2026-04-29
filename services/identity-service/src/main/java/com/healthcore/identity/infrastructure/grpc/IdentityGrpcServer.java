package com.healthcore.identity.infrastructure.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

@Component
public class IdentityGrpcServer implements SmartLifecycle {

    private final IdentityGrpcService identityGrpcService;
    private final int port;
    private Server server;
    private boolean running;

    public IdentityGrpcServer(IdentityGrpcService identityGrpcService, @Value("${grpc.identity.port:9090}") int port) {
        this.identityGrpcService = identityGrpcService;
        this.port = port;
    }

    @Override
    public void start() {
        if (running) {
            return;
        }
        server = ServerBuilder.forPort(port)
                .addService(identityGrpcService)
                .build();
        try {
            server.start();
            running = true;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to start Identity gRPC server", ex);
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

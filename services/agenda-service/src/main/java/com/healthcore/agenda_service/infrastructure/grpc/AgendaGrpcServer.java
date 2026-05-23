package com.healthcore.agenda_service.infrastructure.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

@Component
public class AgendaGrpcServer implements SmartLifecycle {

    private final AgendaLifecycleGrpcService agendaLifecycleGrpcService;
    private final int port;
    private Server server;
    private boolean running;

    public AgendaGrpcServer(
        AgendaLifecycleGrpcService agendaLifecycleGrpcService,
        @Value("${grpc.agenda.port:50052}") int port
    ) {
        this.agendaLifecycleGrpcService = agendaLifecycleGrpcService;
        this.port = port;
    }

    @Override
    public void start() {
        if (running) {
            return;
        }
        server = ServerBuilder.forPort(port)
            .addService(agendaLifecycleGrpcService)
            .build();
        try {
            server.start();
            running = true;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to start Agenda gRPC server", ex);
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

package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import io.grpc.BindableService;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mockStatic;

class ClinicalGrpcServerTest {

    @Test
    void shouldStartServerAndMarkLifecycleAsRunning() throws Exception {
        ClinicalRepositoryPort repositoryPort = mock(ClinicalRepositoryPort.class);
        @SuppressWarnings("rawtypes")
        ServerBuilder builder = mock(ServerBuilder.class);
        Server server = mock(Server.class);
        ClinicalGrpcServer grpcServer = new ClinicalGrpcServer(repositoryPort, 50051);

        try (MockedStatic<ServerBuilder> serverBuilderMock = mockStatic(ServerBuilder.class)) {
            serverBuilderMock.when(() -> ServerBuilder.forPort(50051)).thenReturn(builder);
            when(builder.addService(any(BindableService.class))).thenReturn(builder);
            when(builder.build()).thenReturn(server);

            grpcServer.start();

            assertTrue(grpcServer.isRunning());
            verify(server).start();
        }
    }

    @Test
    void shouldNotStartServerTwiceWhenAlreadyRunning() throws Exception {
        ClinicalRepositoryPort repositoryPort = mock(ClinicalRepositoryPort.class);
        @SuppressWarnings("rawtypes")
        ServerBuilder builder = mock(ServerBuilder.class);
        Server server = mock(Server.class);
        ClinicalGrpcServer grpcServer = new ClinicalGrpcServer(repositoryPort, 50051);

        try (MockedStatic<ServerBuilder> serverBuilderMock = mockStatic(ServerBuilder.class)) {
            serverBuilderMock.when(() -> ServerBuilder.forPort(50051)).thenReturn(builder);
            when(builder.addService(any(BindableService.class))).thenReturn(builder);
            when(builder.build()).thenReturn(server);

            grpcServer.start();
            grpcServer.start();

            serverBuilderMock.verify(() -> ServerBuilder.forPort(50051), times(1));
            verify(server, times(1)).start();
        }
    }

    @Test
    void shouldWrapStartupFailureAsIllegalStateException() throws Exception {
        ClinicalRepositoryPort repositoryPort = mock(ClinicalRepositoryPort.class);
        @SuppressWarnings("rawtypes")
        ServerBuilder builder = mock(ServerBuilder.class);
        Server server = mock(Server.class);
        ClinicalGrpcServer grpcServer = new ClinicalGrpcServer(repositoryPort, 50051);
        RuntimeException failure = new RuntimeException("bind failed");

        try (MockedStatic<ServerBuilder> serverBuilderMock = mockStatic(ServerBuilder.class)) {
            serverBuilderMock.when(() -> ServerBuilder.forPort(50051)).thenReturn(builder);
            when(builder.addService(any(BindableService.class))).thenReturn(builder);
            when(builder.build()).thenReturn(server);
            when(server.start()).thenThrow(failure);

            IllegalStateException exception = assertThrows(IllegalStateException.class, grpcServer::start);

            assertEquals("Failed to start Clinical gRPC server", exception.getMessage());
            assertEquals(failure, exception.getCause());
            assertFalse(grpcServer.isRunning());
        }
    }

    @Test
    void shouldShutdownServerAndMarkLifecycleAsStopped() throws Exception {
        ClinicalRepositoryPort repositoryPort = mock(ClinicalRepositoryPort.class);
        @SuppressWarnings("rawtypes")
        ServerBuilder builder = mock(ServerBuilder.class);
        Server server = mock(Server.class);
        ClinicalGrpcServer grpcServer = new ClinicalGrpcServer(repositoryPort, 50051);

        try (MockedStatic<ServerBuilder> serverBuilderMock = mockStatic(ServerBuilder.class)) {
            serverBuilderMock.when(() -> ServerBuilder.forPort(50051)).thenReturn(builder);
            when(builder.addService(any(BindableService.class))).thenReturn(builder);
            when(builder.build()).thenReturn(server);

            grpcServer.start();
            grpcServer.stop();

            verify(server).shutdown();
            assertFalse(grpcServer.isRunning());
        }
    }

    @Test
    void shouldExposeLowestLifecyclePhase() {
        ClinicalRepositoryPort repositoryPort = mock(ClinicalRepositoryPort.class);
        ClinicalGrpcServer grpcServer = new ClinicalGrpcServer(repositoryPort, 50051);

        assertEquals(Integer.MIN_VALUE, grpcServer.getPhase());
    }
}

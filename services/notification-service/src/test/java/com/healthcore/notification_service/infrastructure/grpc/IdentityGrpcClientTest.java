package com.healthcore.notification_service.infrastructure.grpc;

import com.healthcore.identity.grpc.IdentityDirectoryGrpc;
import com.healthcore.identity.grpc.UserContact;
import com.healthcore.identity.grpc.UserContactsRequest;
import com.healthcore.identity.grpc.UserContactsResponse;
import com.healthcore.notification_service.application.exception.UserDirectoryUnavailableException;
import io.grpc.ManagedChannel;
import io.grpc.Server;
import io.grpc.Status;
import io.grpc.inprocess.InProcessChannelBuilder;
import io.grpc.inprocess.InProcessServerBuilder;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class IdentityGrpcClientTest {

    @Test
    void getEmailsByUserIdsReturnsMap() throws IOException {
        String serverName = InProcessServerBuilder.generateName();
        Server server = InProcessServerBuilder.forName(serverName)
                .directExecutor()
                .addService(new IdentityDirectoryGrpc.IdentityDirectoryImplBase() {
                    @Override
                    public void getUserContacts(UserContactsRequest request, StreamObserver<UserContactsResponse> responseObserver) {
                        UserContactsResponse response = UserContactsResponse.newBuilder()
                                .addContacts(UserContact.newBuilder().setUserId("user-1").setEmail("user1@healthcore.com").build())
                                .addContacts(UserContact.newBuilder().setUserId("user-2").setEmail("user2@healthcore.com").build())
                                .build();
                        responseObserver.onNext(response);
                        responseObserver.onCompleted();
                    }
                })
                .build()
                .start();

        ManagedChannel channel = InProcessChannelBuilder.forName(serverName)
                .directExecutor()
                .build();
        IdentityDirectoryGrpc.IdentityDirectoryBlockingStub stub = IdentityDirectoryGrpc.newBlockingStub(channel);

        IdentityGrpcClient client = new IdentityGrpcClient(stub, channel);

        Map<String, String> result = client.getEmailsByUserIds(List.of("user-1", "user-2"));

        assertEquals("user1@healthcore.com", result.get("user-1"));
        assertEquals("user2@healthcore.com", result.get("user-2"));

        client.shutdownChannel();
        server.shutdownNow();
    }

    @Test
    void getEmailsByUserIdsUsesCachedContacts() throws IOException {
        AtomicInteger callCount = new AtomicInteger();
        String serverName = InProcessServerBuilder.generateName();
        Server server = InProcessServerBuilder.forName(serverName)
                .directExecutor()
                .addService(new IdentityDirectoryGrpc.IdentityDirectoryImplBase() {
                    @Override
                    public void getUserContacts(UserContactsRequest request, StreamObserver<UserContactsResponse> responseObserver) {
                        callCount.incrementAndGet();
                        UserContactsResponse response = UserContactsResponse.newBuilder()
                                .addContacts(UserContact.newBuilder().setUserId("user-1").setEmail("user1@healthcore.com").build())
                                .build();
                        responseObserver.onNext(response);
                        responseObserver.onCompleted();
                    }
                })
                .build()
                .start();

        ManagedChannel channel = InProcessChannelBuilder.forName(serverName)
                .directExecutor()
                .build();
        IdentityDirectoryGrpc.IdentityDirectoryBlockingStub stub = IdentityDirectoryGrpc.newBlockingStub(channel);
        Clock fixedClock = Clock.fixed(Instant.parse("2026-04-28T09:00:00Z"), ZoneOffset.UTC);
        IdentityGrpcClient client = new IdentityGrpcClient(stub, channel, Duration.ofMinutes(10), fixedClock);

        client.getEmailsByUserIds(List.of("user-1"));
        Map<String, String> secondResult = client.getEmailsByUserIds(List.of("user-1"));

        assertEquals("user1@healthcore.com", secondResult.get("user-1"));
        assertEquals(1, callCount.get());

        client.shutdownChannel();
        server.shutdownNow();
    }

    @Test
    void getEmailsByUserIdsThrowsOnGrpcError() throws IOException {
        String serverName = InProcessServerBuilder.generateName();
        Server server = InProcessServerBuilder.forName(serverName)
                .directExecutor()
                .addService(new IdentityDirectoryGrpc.IdentityDirectoryImplBase() {
                    @Override
                    public void getUserContacts(UserContactsRequest request, StreamObserver<UserContactsResponse> responseObserver) {
                        responseObserver.onError(Status.UNAVAILABLE.asRuntimeException());
                    }
                })
                .build()
                .start();

        ManagedChannel channel = InProcessChannelBuilder.forName(serverName)
                .directExecutor()
                .build();
        IdentityDirectoryGrpc.IdentityDirectoryBlockingStub stub = IdentityDirectoryGrpc.newBlockingStub(channel);

        IdentityGrpcClient client = new IdentityGrpcClient(stub, channel);

        assertThrows(
                UserDirectoryUnavailableException.class,
                () -> client.getEmailsByUserIds(List.of("user-1"))
        );

        client.shutdownChannel();
        server.shutdownNow();
    }
}


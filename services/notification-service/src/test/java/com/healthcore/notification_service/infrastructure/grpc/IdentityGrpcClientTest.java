package com.healthcore.notification_service.infrastructure.grpc;

import com.healthcore.identity.grpc.IdentityDirectoryGrpc;
import com.healthcore.identity.grpc.UserContact;
import com.healthcore.identity.grpc.UserContactsRequest;
import com.healthcore.identity.grpc.UserContactsResponse;
import io.grpc.ManagedChannel;
import io.grpc.Server;
import io.grpc.Status;
import io.grpc.inprocess.InProcessChannelBuilder;
import io.grpc.inprocess.InProcessServerBuilder;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    void getEmailsByUserIdsReturnsEmptyOnGrpcError() throws IOException {
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

        Map<String, String> result = client.getEmailsByUserIds(List.of("user-1"));

        assertTrue(result.isEmpty());

        client.shutdownChannel();
        server.shutdownNow();
    }
}


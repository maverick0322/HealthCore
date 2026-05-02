package com.healthcore.notification_service.infrastructure.grpc;

import com.healthcore.identity.grpc.IdentityDirectoryGrpc;
import com.healthcore.identity.grpc.UserContact;
import com.healthcore.identity.grpc.UserContactsRequest;
import com.healthcore.identity.grpc.UserContactsResponse;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.infrastructure.config.GrpcIdentityProperties;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Component
public class IdentityGrpcClient implements UserDirectoryPort {

    private static final int GRPC_TIMEOUT_SECONDS = 5;
    private static final int GRPC_SHUTDOWN_SECONDS = 5;

    private final IdentityDirectoryGrpc.IdentityDirectoryBlockingStub identityStub;
    private final ManagedChannel channel;

    @org.springframework.beans.factory.annotation.Autowired
    public IdentityGrpcClient(GrpcIdentityProperties grpcIdentityProperties) {
        this.channel = ManagedChannelBuilder.forTarget(grpcIdentityProperties.target())
                .usePlaintext()
                .build();
        this.identityStub = IdentityDirectoryGrpc.newBlockingStub(channel);
    }

    IdentityGrpcClient(IdentityDirectoryGrpc.IdentityDirectoryBlockingStub identityStub, ManagedChannel channel) {
        this.identityStub = identityStub;
        this.channel = channel;
    }

    @Override
    public Map<String, String> getEmailsByUserIds(List<String> userIds) {
        try {
            UserContactsRequest request = UserContactsRequest.newBuilder()
                    .addAllUserIds(userIds)
                    .build();
            UserContactsResponse response = identityStub
                    .withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .getUserContacts(request);

            return response.getContactsList().stream()
                    .collect(Collectors.toMap(UserContact::getUserId, UserContact::getEmail));
        } catch (StatusRuntimeException ex) {
            Status.Code code = ex.getStatus().getCode();
            log.warn("Identity gRPC call failed with status: {}", code, ex);
            return Map.of();
        } catch (RuntimeException ex) {
            log.warn("Identity gRPC call failed", ex);
            return Map.of();
        }
    }

    @PreDestroy
    public void shutdownChannel() {
        if (channel == null) {
            return;
        }
        channel.shutdown();
        try {
            if (!channel.awaitTermination(GRPC_SHUTDOWN_SECONDS, TimeUnit.SECONDS)) {
                channel.shutdownNow();
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            channel.shutdownNow();
        }
    }
}

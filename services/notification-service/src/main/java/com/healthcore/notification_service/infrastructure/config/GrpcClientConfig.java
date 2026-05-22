package com.healthcore.notification_service.infrastructure.config;

import com.healthcore.identity.grpc.IdentityDirectoryGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PreDestroy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class GrpcClientConfig {

    private static final int GRPC_SHUTDOWN_SECONDS = 5;

    private ManagedChannel identityManagedChannel;

    @Bean(destroyMethod = "")
    public ManagedChannel identityManagedChannel(GrpcIdentityProperties grpcIdentityProperties) {
        this.identityManagedChannel = ManagedChannelBuilder.forTarget(grpcIdentityProperties.target())
                .usePlaintext()
                .build();
        return identityManagedChannel;
    }

    @Bean
    public IdentityDirectoryGrpc.IdentityDirectoryBlockingStub identityDirectoryBlockingStub(
            ManagedChannel identityManagedChannel
    ) {
        return IdentityDirectoryGrpc.newBlockingStub(identityManagedChannel);
    }

    @PreDestroy
    public void shutdownIdentityManagedChannel() {
        if (identityManagedChannel == null) {
            return;
        }
        identityManagedChannel.shutdown();
        try {
            if (!identityManagedChannel.awaitTermination(GRPC_SHUTDOWN_SECONDS, TimeUnit.SECONDS)) {
                identityManagedChannel.shutdownNow();
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            identityManagedChannel.shutdownNow();
        }
    }
}

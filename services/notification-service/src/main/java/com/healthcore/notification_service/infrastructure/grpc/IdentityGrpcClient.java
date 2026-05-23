package com.healthcore.notification_service.infrastructure.grpc;

import com.healthcore.identity.grpc.IdentityDirectoryGrpc;
import com.healthcore.identity.grpc.UserContact;
import com.healthcore.identity.grpc.UserContactsRequest;
import com.healthcore.identity.grpc.UserContactsResponse;
import com.healthcore.notification_service.application.exception.UserDirectoryUnavailableException;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import io.grpc.ManagedChannel;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Component
public class IdentityGrpcClient implements UserDirectoryPort {

    private static final int GRPC_TIMEOUT_SECONDS = 5;
    private static final int GRPC_SHUTDOWN_SECONDS = 5;

    private final IdentityDirectoryGrpc.IdentityDirectoryBlockingStub identityStub;
    private final ManagedChannel channel;
    private final Duration cacheTtl;
    private final Clock clock;
    private final Map<String, CachedEmail> emailCache = new ConcurrentHashMap<>();

    @Autowired
    public IdentityGrpcClient(
            IdentityDirectoryGrpc.IdentityDirectoryBlockingStub identityStub,
            ManagedChannel channel,
            @Value("${app.user-directory.cache-ttl:PT10M}") Duration cacheTtl
    ) {
        this(identityStub, channel, cacheTtl, Clock.systemUTC());
    }

    IdentityGrpcClient(IdentityDirectoryGrpc.IdentityDirectoryBlockingStub identityStub, ManagedChannel channel) {
        this(identityStub, channel, Duration.ZERO, Clock.systemUTC());
    }

    IdentityGrpcClient(
            IdentityDirectoryGrpc.IdentityDirectoryBlockingStub identityStub,
            ManagedChannel channel,
            Duration cacheTtl,
            Clock clock
    ) {
        this.identityStub = identityStub;
        this.channel = channel;
        this.cacheTtl = cacheTtl;
        this.clock = clock;
    }

    @Override
    public Map<String, String> getEmailsByUserIds(List<String> userIds) {
        List<String> normalizedUserIds = userIds.stream()
                .filter(userId -> userId != null && !userId.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        Map<String, String> emailsByUserId = new HashMap<>();
        List<String> cacheMisses = collectCacheMisses(normalizedUserIds, emailsByUserId);
        if (cacheMisses.isEmpty()) {
            return emailsByUserId;
        }

        try {
            UserContactsRequest request = UserContactsRequest.newBuilder()
                    .addAllUserIds(cacheMisses)
                    .build();
            UserContactsResponse response = identityStub
                    .withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .getUserContacts(request);

            Map<String, String> fetchedEmails = response.getContactsList().stream()
                    .collect(Collectors.toMap(UserContact::getUserId, UserContact::getEmail));
            cacheFetchedEmails(fetchedEmails);
            emailsByUserId.putAll(fetchedEmails);
            return emailsByUserId;
        } catch (StatusRuntimeException ex) {
            Status.Code code = ex.getStatus().getCode();
            log.warn("Identity gRPC call failed with status: {}", code, ex);
            throw new UserDirectoryUnavailableException("Identity gRPC call failed with status: " + code, ex);
        } catch (RuntimeException ex) {
            log.warn("Identity gRPC call failed", ex);
            throw new UserDirectoryUnavailableException("Identity gRPC call failed", ex);
        }
    }

    private List<String> collectCacheMisses(List<String> userIds, Map<String, String> emailsByUserId) {
        Instant now = clock.instant();
        List<String> cacheMisses = new ArrayList<>();
        for (String userId : userIds) {
            CachedEmail cachedEmail = emailCache.get(userId);
            if (cachedEmail != null && cachedEmail.expiresAt().isAfter(now)) {
                emailsByUserId.put(userId, cachedEmail.email());
                continue;
            }
            emailCache.remove(userId);
            cacheMisses.add(userId);
        }
        return cacheMisses;
    }

    private void cacheFetchedEmails(Map<String, String> fetchedEmails) {
        if (cacheTtl.isZero() || cacheTtl.isNegative()) {
            return;
        }
        Instant expiresAt = clock.instant().plus(cacheTtl);
        fetchedEmails.forEach((userId, email) -> {
            if (email != null && !email.isBlank()) {
                emailCache.put(userId, new CachedEmail(email, expiresAt));
            }
        });
    }

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

    private record CachedEmail(String email, Instant expiresAt) {
    }
}

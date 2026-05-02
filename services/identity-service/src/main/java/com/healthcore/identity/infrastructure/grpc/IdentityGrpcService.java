package com.healthcore.identity.infrastructure.grpc;

import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.repository.UserRepository;
import com.healthcore.identity.grpc.IdentityDirectoryGrpc;
import com.healthcore.identity.grpc.UserContact;
import com.healthcore.identity.grpc.UserContactsRequest;
import com.healthcore.identity.grpc.UserContactsResponse;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class IdentityGrpcService extends IdentityDirectoryGrpc.IdentityDirectoryImplBase {

    private final UserRepository userRepository;

    public IdentityGrpcService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
        public void getUserContacts(UserContactsRequest request, StreamObserver<UserContactsResponse> responseObserver) {
        List<String> userIds = request.getUserIdsList().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();

        Map<String, String> emailByUserId = userRepository.findByIdIn(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getEmail));

        List<UserContact> contacts = userIds.stream()
                .map(id -> UserContact.newBuilder()
                        .setUserId(id)
                        .setEmail(emailByUserId.getOrDefault(id, ""))
                        .build())
                .toList();

        UserContactsResponse response = UserContactsResponse.newBuilder()
                .addAllContacts(contacts)
                .build();
        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}

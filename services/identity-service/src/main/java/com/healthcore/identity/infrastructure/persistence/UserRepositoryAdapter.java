package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepository {

    private final SpringDataMongoUserRepository mongoRepository;

    @Override
    public Optional<User> findByEmail(String email) {
        return mongoRepository.findByEmail(email)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmailAndProvider(String email, AuthProvider provider) {
        return mongoRepository.findByEmailAndProvider(email, provider)
                .map(this::toDomain);
    }

    @Override
    public User save(User user) {
        UserDocument document = toDocument(user);
        UserDocument savedDocument = mongoRepository.save(document);
        return toDomain(savedDocument);
    }

    @Override
    public Optional<User> findById(String id) {
        return mongoRepository.findById(id)
                .map(this::toDomain);
    }

    @Override
    public List<User> findByIdIn(List<String> ids) {
        return mongoRepository.findByIdIn(ids).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<User> findAll() {
        return mongoRepository.findAll().stream()
                .map(this::toDomain)
                .toList();
    }

    private User toDomain(UserDocument doc) {
        return User.builder()
                .id(doc.getId())
                .email(doc.getEmail())
                .passwordHash(doc.getPasswordHash())
                .role(doc.getRole())
                .provider(doc.getProvider())
                .emailVerified(doc.isEmailVerified())
                .verifiedAt(doc.getVerifiedAt())
                .enabled(doc.isEnabled())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    private UserDocument toDocument(User user) {
        return UserDocument.builder()
                .id(user.getId())
                .email(user.getEmail())
                .passwordHash(user.getPasswordHash())
                .role(user.getRole())
                .provider(user.getProvider())
                .emailVerified(user.isEmailVerified())
                .verifiedAt(user.getVerifiedAt())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
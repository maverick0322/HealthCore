package com.healthcore.identity.domain.repository;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.User;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailAndProvider(String email, AuthProvider provider);
    User save(User user);
}
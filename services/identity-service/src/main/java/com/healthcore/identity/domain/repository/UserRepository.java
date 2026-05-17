package com.healthcore.identity.domain.repository;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.User;
import java.util.List;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailAndProvider(String email, AuthProvider provider);
    Optional<User> findById(String id);
    List<User> findByIdIn(List<String> ids);
    List<User> findAll();
    User save(User user);
}
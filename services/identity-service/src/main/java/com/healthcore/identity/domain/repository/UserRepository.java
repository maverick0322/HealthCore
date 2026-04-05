package com.healthcore.identity.domain.repository;

import com.healthcore.identity.domain.User;
import java.util.Optional;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    User save(User user);
}
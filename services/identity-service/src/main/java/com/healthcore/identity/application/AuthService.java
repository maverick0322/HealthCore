package com.healthcore.identity.application;

import com.healthcore.identity.domain.User;
import com.healthcore.identity.infrastructure.persistence.UserDocument;
import com.healthcore.identity.infrastructure.persistence.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerPatient(String email, String plainPassword) {
        Optional<UserDocument> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            throw new IllegalArgumentException("Email already registered in HealthCore");
        }

        // 2. Hashear la contraseña (Por ahora es un simulacro, luego pondremos BCrypt)
        String hashedPassword = hashPassword(plainPassword);

        UserDocument newUserDoc = new UserDocument();
        newUserDoc.setEmail(email);
        newUserDoc.setPasswordHash(hashedPassword);
        newUserDoc.setRole(User.Role.PATIENT);
        newUserDoc.setActive(true);
        newUserDoc.setCreatedAt(LocalDateTime.now());

        UserDocument savedDoc = userRepository.save(newUserDoc);

        return new User(
                savedDoc.getId(),
                savedDoc.getEmail(),
                savedDoc.getPasswordHash(),
                savedDoc.getRole(),
                savedDoc.isActive(),
                savedDoc.getCreatedAt()
        );
    }

    private String hashPassword(String plainPassword) {
        // TODO: Integrar Spring Security más adelante
        return "hashed_simulated_" + plainPassword;
    }
}
package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.User;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "users")
public class UserDocument {

    @Id
    private String id;

    @Field("email")
    private String email;

    @Field("password_hash")
    private String passwordHash;

    @Field("role")
    private User.Role role;

    @Field("is_active")
    private boolean isActive;

    @Field("created_at")
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
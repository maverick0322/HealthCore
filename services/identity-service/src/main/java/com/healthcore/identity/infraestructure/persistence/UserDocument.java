package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.User;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
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
}
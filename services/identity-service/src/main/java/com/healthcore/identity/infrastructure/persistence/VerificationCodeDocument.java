package com.healthcore.identity.infrastructure.persistence;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "verification_codes")
public class VerificationCodeDocument {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    @Indexed
    @Field("email")
    private String email;

    @Indexed(unique = true)
    @Field("code_hash")
    private String codeHash;

    @Indexed(expireAfter = "0s")
    @Field("expires_at")
    private LocalDateTime expiresAt;

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;
}



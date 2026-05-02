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

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "refresh_tokens")
public class RefreshTokenDocument {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    @Indexed
    @Field("email")
    private String email;

    @Indexed(unique = true)
    @Field("token_hash")
    private String tokenHash;

    @Indexed(expireAfter = "0s")
    @Field("expires_at")
    private Instant expiresAt;

    @Field("revoked")
    private boolean revoked;

    @Field("revoked_at")
    private Instant revokedAt;

    @Field("replaced_by_token_hash")
    private String replacedByTokenHash;

    @CreatedDate
    @Field("created_at")
    private Instant createdAt;
}

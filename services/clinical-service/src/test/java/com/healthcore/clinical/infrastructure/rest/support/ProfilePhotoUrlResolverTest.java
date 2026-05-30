package com.healthcore.clinical.infrastructure.rest.support;

import com.healthcore.clinical.infrastructure.grpc.MediaGrpcClientAdapter;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfilePhotoUrlResolverTest {

    @Test
    void shouldDelegateSingleUrlResolutionToMediaAdapter() {
        MediaGrpcClientAdapter mediaGrpcClientAdapter = mock(MediaGrpcClientAdapter.class);
        when(mediaGrpcClientAdapter.getPresignedReadUrl("user-123/avatar.webp"))
                .thenReturn("https://cdn.example.com/user-123/avatar.webp");

        ProfilePhotoUrlResolver resolver = new ProfilePhotoUrlResolver(mediaGrpcClientAdapter);

        String resolvedUrl = resolver.resolveSingleUrl("user-123/avatar.webp");

        assertEquals("https://cdn.example.com/user-123/avatar.webp", resolvedUrl);
        verify(mediaGrpcClientAdapter).getPresignedReadUrl("user-123/avatar.webp");
    }

    @Test
    void shouldResolveBatchLookupNullSafely() {
        ProfilePhotoUrlResolver resolver = new ProfilePhotoUrlResolver(mock(MediaGrpcClientAdapter.class));
        Map<String, String> resolvedUrls = Map.of(
                "user-123/avatar.webp", "https://cdn.example.com/user-123/avatar.webp"
        );

        assertNull(resolver.resolveResolvedUrl(resolvedUrls, null));
        assertNull(resolver.resolveResolvedUrl(resolvedUrls, " "));
        assertEquals(
                "https://cdn.example.com/user-123/avatar.webp",
                resolver.resolveResolvedUrl(resolvedUrls, "user-123/avatar.webp")
        );
    }

    @Test
    void shouldDelegateBatchUrlResolutionToMediaAdapter() {
        MediaGrpcClientAdapter mediaGrpcClientAdapter = mock(MediaGrpcClientAdapter.class);
        Map<String, String> resolvedUrls = Map.of(
                "user-123/avatar.webp", "https://cdn.example.com/user-123/avatar.webp"
        );
        when(mediaGrpcClientAdapter.getPresignedReadUrls(List.of("user-123/avatar.webp")))
                .thenReturn(resolvedUrls);

        ProfilePhotoUrlResolver resolver = new ProfilePhotoUrlResolver(mediaGrpcClientAdapter);

        Map<String, String> response = resolver.resolveBatchUrls(List.of("user-123/avatar.webp"));

        assertEquals(resolvedUrls, response);
        verify(mediaGrpcClientAdapter).getPresignedReadUrls(List.of("user-123/avatar.webp"));
    }
}

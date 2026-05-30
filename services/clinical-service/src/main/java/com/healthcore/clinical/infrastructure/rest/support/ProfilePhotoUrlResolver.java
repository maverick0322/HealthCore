package com.healthcore.clinical.infrastructure.rest.support;

import com.healthcore.clinical.infrastructure.grpc.MediaGrpcClientAdapter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ProfilePhotoUrlResolver {

    private final MediaGrpcClientAdapter mediaGrpcClientAdapter;

    public ProfilePhotoUrlResolver(MediaGrpcClientAdapter mediaGrpcClientAdapter) {
        this.mediaGrpcClientAdapter = mediaGrpcClientAdapter;
    }

    public String resolveSingleUrl(String profilePhotoKey) {
        return mediaGrpcClientAdapter.getPresignedReadUrl(profilePhotoKey);
    }

    public Map<String, String> resolveBatchUrls(List<String> profilePhotoKeys) {
        return mediaGrpcClientAdapter.getPresignedReadUrls(profilePhotoKeys);
    }

    public String resolveResolvedUrl(Map<String, String> profilePhotoUrls, String profilePhotoKey) {
        if (profilePhotoKey == null || profilePhotoKey.isBlank()) {
            return null;
        }
        return profilePhotoUrls.get(profilePhotoKey);
    }
}

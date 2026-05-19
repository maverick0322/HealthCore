package com.healthcore.clinical.infrastructure.reference.sepomex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class ClasspathPostalCodeCatalogAdapter implements PostalCodeCatalogPort {

    private static final Logger logger = LoggerFactory.getLogger(ClasspathPostalCodeCatalogAdapter.class);
    private static final String SNAPSHOT_PATH = "reference/sepomex-postal-codes.json";

    private final ObjectMapper objectMapper;
    private final Resource snapshotResource;
    private Map<String, PostalCodeCatalogEntry> catalogIndex = Map.of();

    public ClasspathPostalCodeCatalogAdapter(
            ObjectMapper objectMapper,
            org.springframework.core.io.ResourceLoader resourceLoader
    ) {
        this.objectMapper = objectMapper;
        this.snapshotResource = resourceLoader.getResource("classpath:" + SNAPSHOT_PATH);
    }

    @PostConstruct
    void loadSnapshot() {
        try (InputStream inputStream = snapshotResource.getInputStream()) {
            List<SnapshotPostalCodeEntry> snapshotEntries = objectMapper.readValue(
                    inputStream,
                    new TypeReference<>() {
                    }
            );

            Map<String, PostalCodeCatalogEntry> index = new LinkedHashMap<>();
            for (SnapshotPostalCodeEntry entry : snapshotEntries) {
                PostalCodeCatalogEntry normalizedEntry = new PostalCodeCatalogEntry(
                        entry.postalCode(),
                        entry.state(),
                        entry.city(),
                        entry.municipality(),
                        entry.colonies()
                );
                index.put(normalizedEntry.postalCode(), normalizedEntry);
            }

            catalogIndex = Map.copyOf(index);
            logger.info("[ClasspathPostalCodeCatalogAdapter] Loaded {} SEPOMEX postal codes from {}",
                    catalogIndex.size(),
                    SNAPSHOT_PATH);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load SEPOMEX snapshot from " + SNAPSHOT_PATH, exception);
        }
    }

    @Override
    public Optional<PostalCodeCatalogEntry> findByPostalCode(String postalCode) {
        if (postalCode == null || postalCode.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(catalogIndex.get(postalCode.trim()));
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record SnapshotPostalCodeEntry(
            String postalCode,
            String state,
            String city,
            String municipality,
            List<String> colonies
    ) {
    }
}

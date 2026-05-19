package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.in.LookupPostalCodeUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.PostalCodeLookupResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clinical/reference")
public class PostalCodeReferenceController {

    private final LookupPostalCodeUseCase lookupPostalCodeUseCase;

    public PostalCodeReferenceController(LookupPostalCodeUseCase lookupPostalCodeUseCase) {
        this.lookupPostalCodeUseCase = lookupPostalCodeUseCase;
    }

    @GetMapping("/postal-codes/{postalCode}")
    @PreAuthorize("hasAnyRole('PATIENT','NUTRITIONIST')")
    public ResponseEntity<PostalCodeLookupResponse> lookupPostalCode(@PathVariable String postalCode) {
        return lookupPostalCodeUseCase.lookupPostalCode(postalCode)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private PostalCodeLookupResponse toResponse(PostalCodeCatalogEntry entry) {
        return new PostalCodeLookupResponse(
                entry.postalCode(),
                entry.state(),
                entry.city(),
                entry.municipality(),
                entry.colonies()
        );
    }
}

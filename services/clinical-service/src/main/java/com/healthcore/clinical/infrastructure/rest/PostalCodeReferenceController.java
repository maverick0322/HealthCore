package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.port.in.LookupPostalCodeUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.PostalCodeLookupResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clinical/reference")
@Tag(name = "Clinical Reference Data", description = "Datos de referencia clínicos y operativos usados por el servicio")
public class PostalCodeReferenceController {

    private final LookupPostalCodeUseCase lookupPostalCodeUseCase;

    public PostalCodeReferenceController(LookupPostalCodeUseCase lookupPostalCodeUseCase) {
        this.lookupPostalCodeUseCase = lookupPostalCodeUseCase;
    }

    @GetMapping("/postal-codes/{postalCode}")
    @PreAuthorize("hasAnyRole('PATIENT','NUTRITIONIST')")
    @Operation(summary = "Consultar datos SEPOMEX por código postal", description = "Resuelve estado, ciudad, municipio y colonias para el código postal solicitado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Código postal resuelto exitosamente",
                    content = @Content(schema = @Schema(implementation = PostalCodeLookupResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes y nutriólogos"),
            @ApiResponse(responseCode = "404", description = "Código postal no encontrado")
    })
    public ResponseEntity<PostalCodeLookupResponse> lookupPostalCode(
            @Parameter(description = "Código postal de 5 dígitos a consultar")
            @PathVariable String postalCode) {
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

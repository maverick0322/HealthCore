package com.healthcore.clinical.infrastructure.rest;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.healthcore.clinical.domain.model.CatalogFoodItem;
import com.healthcore.clinical.domain.port.in.ManageNutritionPlanUseCase;
import com.healthcore.clinical.infrastructure.rest.mapper.NutritionPlanRestMapper;
import com.healthcore.clinical.infrastructure.rest.dto.ApiErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.CatalogFoodResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanUpsertRequest;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionPlanViewResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UnauthorizedErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.ValidationErrorResponseDoc;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/clinical")
@Tag(name = "Nutrition Plans", description = "Operations for nutrition plans and nutrition catalog food lookup")
public class NutritionPlanController {

    private static final Logger logger = LoggerFactory.getLogger(NutritionPlanController.class);

    private final ManageNutritionPlanUseCase manageNutritionPlanUseCase;
    private final NutritionPlanRestMapper nutritionPlanRestMapper;

    public NutritionPlanController(
            ManageNutritionPlanUseCase manageNutritionPlanUseCase,
            NutritionPlanRestMapper nutritionPlanRestMapper
    ) {
        this.manageNutritionPlanUseCase = manageNutritionPlanUseCase;
        this.nutritionPlanRestMapper = nutritionPlanRestMapper;
    }

    @GetMapping("/nutrition-plan/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get my nutrition plan", description = "Returns the nutrition plan visible to the authenticated patient, including its mode and editable context.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nutrition plan returned successfully",
                    content = @Content(schema = @Schema(implementation = NutritionPlanViewResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile or nutrition plan not available",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionPlanViewResponse> getMyNutritionPlan() {
        String patientId = getCurrentUserId();
        logger.info("[NutritionPlanController] GET /nutrition-plan/me patientId={}", patientId);
        return ResponseEntity.ok(nutritionPlanRestMapper.toViewResponse(
                manageNutritionPlanUseCase.getMyNutritionPlan(patientId)
        ));
    }

    @PutMapping("/nutrition-plan/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create or update my nutrition plan", description = "Stores the self-managed nutrition plan of the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nutrition plan saved successfully",
                    content = @Content(schema = @Schema(implementation = NutritionPlanViewResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid nutrition plan payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionPlanViewResponse> upsertMyNutritionPlan(
            @Valid @RequestBody NutritionPlanUpsertRequest request
    ) {
        String patientId = getCurrentUserId();
        logger.info("[NutritionPlanController] PUT /nutrition-plan/me patientId={} sections={}",
                patientId, request.sections().size());
        return ResponseEntity.ok(nutritionPlanRestMapper.toViewResponse(
                manageNutritionPlanUseCase.upsertMyNutritionPlan(
                        patientId,
                        nutritionPlanRestMapper.toDraft(request)
                )
        ));
    }

    @GetMapping("/nutritionist/patients/{patientId}/nutrition-plan")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Get linked patient nutrition plan", description = "Returns the patient's nutrition plan for the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nutrition plan returned successfully",
                    content = @Content(schema = @Schema(implementation = NutritionPlanViewResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient or nutrition plan not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionPlanViewResponse> getNutritionistPatientNutritionPlan(
            @Parameter(description = "Identifier of the linked patient")
            @PathVariable String patientId
    ) {
        logger.info("[NutritionPlanController] GET /nutritionist/patients/{}/nutrition-plan nutritionistId={}",
                patientId, getCurrentUserId());
        return ResponseEntity.ok(nutritionPlanRestMapper.toViewResponse(
                manageNutritionPlanUseCase.getNutritionistPatientNutritionPlan(getCurrentUserId(), patientId)
        ));
    }

    @PutMapping("/nutritionist/patients/{patientId}/nutrition-plan")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Create or update linked patient nutrition plan", description = "Stores the nutritionist-managed nutrition plan for a linked patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nutrition plan saved successfully",
                    content = @Content(schema = @Schema(implementation = NutritionPlanViewResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid nutrition plan payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionPlanViewResponse> upsertNutritionistPatientNutritionPlan(
            @Parameter(description = "Identifier of the linked patient")
            @PathVariable String patientId,
            @Valid @RequestBody NutritionPlanUpsertRequest request
    ) {
        logger.info("[NutritionPlanController] PUT /nutritionist/patients/{}/nutrition-plan nutritionistId={} sections={}",
                patientId, getCurrentUserId(), request.sections().size());
        return ResponseEntity.ok(nutritionPlanRestMapper.toViewResponse(
                manageNutritionPlanUseCase.upsertNutritionistPatientNutritionPlan(
                getCurrentUserId(),
                patientId,
                nutritionPlanRestMapper.toDraft(request)
        )));
    }

    @GetMapping("/catalog/foods/search")
    @PreAuthorize("hasAnyRole('PATIENT','NUTRITIONIST')")
    @Operation(summary = "Search catalog foods", description = "Searches foods available in the nutrition catalog to build or review plans.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search results returned successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = CatalogFoodResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Invalid search query",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient or nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "503", description = "Nutrition catalog is temporarily unavailable",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<List<CatalogFoodResponse>> searchCatalogFoods(
            @Parameter(description = "Free-text query used to search catalog foods")
            @RequestParam String query) {
        logger.info("[NutritionPlanController] GET /catalog/foods/search query='{}'", query);
        List<CatalogFoodResponse> response = manageNutritionPlanUseCase.searchCatalogFoods(query).stream()
                .map(nutritionPlanRestMapper::toCatalogFoodResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    private String getCurrentUserId() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }
}

package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/clinical")
public class ClinicalController {

    private final ManageProfileUseCase manageProfileUseCase;

    public ClinicalController(ManageProfileUseCase manageProfileUseCase) {
        this.manageProfileUseCase = manageProfileUseCase;
    }

    @PostMapping("/profile")
    public ResponseEntity<Void> createProfile(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateProfileRequest request) {

        PatientProfile profile = new PatientProfile(
                userId, 
                request.weightKg(), 
                request.heightCm(),
                request.birthDate(), 
                Gender.valueOf(request.gender().toUpperCase()),
                ActivityLevel.valueOf(request.activityLevel().toUpperCase())
        );

        manageProfileUseCase.createProfile(profile);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/goals/me")
    public ResponseEntity<HealthGoalResponse> getMyGoals(@RequestHeader("X-User-Id") String userId) {
        
        Optional<PatientProfile> profileOpt = manageProfileUseCase.getProfileByUserId(userId);

        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        HealthGoal goal = profileOpt.get().generateHealthGoals();
        
        HealthGoalResponse response = new HealthGoalResponse(
                goal.targetCalories(), 
                goal.targetProtein(),
                goal.targetCarbs(), 
                goal.targetFat()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/weight")
    public ResponseEntity<HealthGoalResponse> updateWeight(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateWeightRequest request) {
        
        HealthGoal newGoal = manageProfileUseCase.updateWeight(userId, request.weightKg());
        
        HealthGoalResponse response = new HealthGoalResponse(
                newGoal.targetCalories(),
                newGoal.targetProtein(),
                newGoal.targetCarbs(),
                newGoal.targetFat()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/weight/history")
    public ResponseEntity<List<WeightRecord>> getWeightHistory(
            @RequestHeader("X-User-Id") String userId) {
        
        List<WeightRecord> history = manageProfileUseCase.getWeightHistory(userId);
        return ResponseEntity.ok(history);
    }
}

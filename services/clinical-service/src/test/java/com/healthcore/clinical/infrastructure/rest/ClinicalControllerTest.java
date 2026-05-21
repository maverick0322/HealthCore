package com.healthcore.clinical.infrastructure.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ClinicalController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class ClinicalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ManageProfileUseCase manageProfileUseCase;

    private void setSecurityContext(String userId, String... roles) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Stream.of(roles)
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                .collect(Collectors.toList())
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldCreateProfileAndReturnOk() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        CreateProfileRequest request = createPatientRequest();
        PatientProfile mockProfile = Mockito.mock(PatientProfile.class);
        when(manageProfileUseCase.createProfile(any())).thenReturn(mockProfile);

        mockMvc.perform(post("/api/v1/clinical/profile")
                        .header("X-User-Id", "user-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldUpdateProfileAndReturnUpdatedResponse() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        PatientProfile profile = createPatientProfile("user-123");

        when(manageProfileUseCase.updateProfile(eq("user-123"), any(PatientProfile.class))).thenReturn(profile);

        mockMvc.perform(put("/api/v1/clinical/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createPatientRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Carlos"))
                .andExpect(jsonPath("$.goal").value("weight-loss"))
                .andExpect(jsonPath("$.profileCompleted").value(true));
    }

    @Test
    void shouldGetGoalsAndReturnOk() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        com.healthcore.clinical.domain.model.HealthGoal mockGoal =
                Mockito.mock(com.healthcore.clinical.domain.model.HealthGoal.class);
        when(mockGoal.targetCalories()).thenReturn(2500);
        when(mockGoal.targetProtein()).thenReturn(150);
        when(mockGoal.targetCarbs()).thenReturn(250);
        when(mockGoal.targetFat()).thenReturn(70);
        when(mockGoal.targetWaterGlasses()).thenReturn(10);

        PatientProfile mockProfile = Mockito.mock(PatientProfile.class);
        when(mockProfile.generateHealthGoals()).thenReturn(mockGoal);
        when(manageProfileUseCase.getProfileByUserId("user-123")).thenReturn(Optional.of(mockProfile));

        mockMvc.perform(get("/api/v1/clinical/goals/me").header("X-User-Id", "user-123"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnOkWhenUpdatingWeight() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        LocalDate targetDate = LocalDate.now();
        UpdateWeightRequest request = new UpdateWeightRequest(80.5, targetDate);

        com.healthcore.clinical.domain.model.HealthGoal mockGoal =
                Mockito.mock(com.healthcore.clinical.domain.model.HealthGoal.class);
        when(mockGoal.targetCalories()).thenReturn(2600);
        when(mockGoal.targetProtein()).thenReturn(160);
        when(mockGoal.targetCarbs()).thenReturn(260);
        when(mockGoal.targetFat()).thenReturn(75);
        when(mockGoal.targetWaterGlasses()).thenReturn(11);

        when(manageProfileUseCase.updateWeight(eq("user-123"), eq(80.5), eq(targetDate))).thenReturn(mockGoal);

        mockMvc.perform(post("/api/v1/clinical/weight")
                        .header("X-User-Id", "user-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetCalories").value(2600))
                .andExpect(jsonPath("$.targetWaterGlasses").value(11));

        verify(manageProfileUseCase).updateWeight("user-123", 80.5, targetDate);
    }

    @Test
    void shouldReturnOkAndListWhenGettingWeightHistory() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        List<WeightRecord> history = List.of(
                new WeightRecord(70.0, LocalDate.now().minusDays(10)),
                new WeightRecord(68.5, LocalDate.now())
        );

        when(manageProfileUseCase.getWeightHistory("user-123")).thenReturn(history);

        mockMvc.perform(get("/api/v1/clinical/weight/history").header("X-User-Id", "user-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].weightKg").value(70.0))
                .andExpect(jsonPath("$[1].weightKg").value(68.5));
    }

    @Test
    void shouldReturnMyProfileWithNutritionistId() throws Exception {
        String patientId = "patient-123";
        setSecurityContext(patientId, "PATIENT");

        PatientProfile mockProfile = createPatientProfile(patientId);
        mockProfile.assignNutritionist("nutri-999");

        when(manageProfileUseCase.getProfileByUserId(patientId)).thenReturn(Optional.of(mockProfile));

        mockMvc.perform(get("/api/v1/clinical/profile/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(patientId))
                .andExpect(jsonPath("$.firstName").value("Carlos"))
                .andExpect(jsonPath("$.weightKg").value(70.0))
                .andExpect(jsonPath("$.goal").value("weight-loss"))
                .andExpect(jsonPath("$.nutritionistId").value("nutri-999"));
    }

    @Test
    void shouldCreateNutritionistProfile() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        when(manageProfileUseCase.createNutritionistProfile(any())).thenReturn(createNutritionistProfile("nutri-123"));

        mockMvc.perform(post("/api/v1/clinical/nutritionist/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createNutritionistRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void shouldGetNutritionistProfile() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        when(manageProfileUseCase.getNutritionistProfileByUserId("nutri-123"))
                .thenReturn(Optional.of(createNutritionistProfile("nutri-123")));

        mockMvc.perform(get("/api/v1/clinical/nutritionist/profile/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Daniel Martinez"))
                .andExpect(jsonPath("$.specializations[0]").value("CLINICAL"))
                .andExpect(jsonPath("$.profileCompleted").value(true));
    }

    @Test
    void shouldUpdateNutritionistProfile() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        when(manageProfileUseCase.updateNutritionistProfile(eq("nutri-123"), any(NutritionistProfile.class)))
                .thenReturn(createNutritionistProfile("nutri-123"));

        mockMvc.perform(put("/api/v1/clinical/nutritionist/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createNutritionistRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professionalLicense").value("12345678"));
    }

    @Test
    void shouldReturnLinkedPatientsForNutritionist() throws Exception {
        String nutritionistId = "nutri-123";
        setSecurityContext(nutritionistId, "NUTRITIONIST");

        PatientProfile patientOne = createPatientProfile("patient-one@example.com");
        patientOne.assignNutritionist(nutritionistId);
        PatientProfile patientTwo = new PatientProfile(
                "patient-two@example.com",
                "Maria",
                "Lopez",
                null,
                65.0,
                168.0,
                LocalDate.of(1992, 5, 10),
                Gender.FEMALE,
                ActivityLevel.LIGHTLY_ACTIVE,
                "health",
                "vegetarian",
                List.of("gluten"),
                List.of()
        );
        patientTwo.assignNutritionist(nutritionistId);

        when(manageProfileUseCase.getProfilesByNutritionistId(nutritionistId))
                .thenReturn(List.of(patientOne, patientTwo));

        mockMvc.perform(get("/api/v1/clinical/nutritionist/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fullName").value("Carlos Gomez"))
                .andExpect(jsonPath("$[1].fullName").value("Maria Lopez"));
    }

    @Test
    void shouldReturnPatientProfileForNutritionist() throws Exception {
        String nutritionistId = "nutri-123";
        String patientId = "patient-one@example.com";
        setSecurityContext(nutritionistId, "NUTRITIONIST");

        PatientProfile patient = createPatientProfile(patientId);
        patient.assignNutritionist(nutritionistId);

        when(manageProfileUseCase.getProfileForNutritionist(nutritionistId, patientId)).thenReturn(patient);

        mockMvc.perform(get("/api/v1/clinical/nutritionist/patients/{patientId}", patientId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(patientId))
                .andExpect(jsonPath("$.fullName").value("Carlos Gomez"))
                .andExpect(jsonPath("$.nutritionistId").value(nutritionistId));
    }

    private CreateProfileRequest createPatientRequest() {
        return new CreateProfileRequest(
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                "MALE",
                "MODERATELY_ACTIVE",
                "weight-loss",
                "omnivore",
                List.of("gluten"),
                List.of("cebolla")
        );
    }

    private PatientProfile createPatientProfile(String userId) {
        return new PatientProfile(
                userId,
                "Carlos",
                "Gomez",
                null,
                70.0,
                175.0,
                LocalDate.of(1990, 1, 1),
                Gender.MALE,
                ActivityLevel.MODERATELY_ACTIVE,
                "weight-loss",
                "omnivore",
                List.of(),
                List.of()
        );
    }

    private UpsertNutritionistProfileRequest createNutritionistRequest() {
        return new UpsertNutritionistProfileRequest(
                "Daniel",
                "Martinez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("PRESENTIAL", "ONLINE"),
                "5512345678",
                new ClinicAddressRequest(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        "Narvarte Oriente",
                        "Xola",
                        "123",
                        null
                ),
                "Especialista en nutricion clinica."
        );
    }

    private NutritionistProfile createNutritionistProfile(String userId) {
        return new NutritionistProfile(
                userId,
                "Daniel",
                "Martinez",
                null,
                List.of("CLINICAL"),
                null,
                "12345678",
                List.of("PRESENTIAL", "ONLINE"),
                "5512345678",
                new ClinicAddress(
                        "03100",
                        "Ciudad de Mexico",
                        "Ciudad de Mexico",
                        "Benito Juarez",
                        "Narvarte Oriente",
                        "Xola",
                        "123",
                        null
                ),
                "Especialista en nutricion clinica."
        );
    }
}

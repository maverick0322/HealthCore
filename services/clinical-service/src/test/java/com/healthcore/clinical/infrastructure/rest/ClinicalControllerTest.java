package com.healthcore.clinical.infrastructure.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressRow;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.infrastructure.grpc.MediaGrpcClientAdapter;
import com.healthcore.clinical.infrastructure.rest.mapper.ClinicAddressRestMapper;
import com.healthcore.clinical.infrastructure.rest.mapper.ClinicalProfileRestMapper;
import com.healthcore.clinical.infrastructure.rest.mapper.HealthGoalRestMapper;
import com.healthcore.clinical.infrastructure.rest.mapper.NutritionistProfileRestMapper;
import com.healthcore.clinical.infrastructure.rest.mapper.NutritionistWeightProgressRestMapper;
import com.healthcore.clinical.infrastructure.rest.mapper.PatientProfileRestMapper;
import com.healthcore.clinical.infrastructure.rest.support.ProfilePhotoUrlResolver;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateProfilePhotoRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdatePatientMetricsRequest;
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
import org.springframework.context.annotation.Import;
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

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {PatientClinicalController.class, NutritionistClinicalController.class},
        excludeAutoConfiguration = {SecurityAutoConfiguration.class}
)
@AutoConfigureMockMvc(addFilters = false)
@Import({
        ClinicalProfileRestMapper.class,
        PatientProfileRestMapper.class,
        NutritionistProfileRestMapper.class,
        NutritionistWeightProgressRestMapper.class,
        ClinicAddressRestMapper.class,
        HealthGoalRestMapper.class,
        ProfilePhotoUrlResolver.class
})
class ClinicalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ManageProfileUseCase manageProfileUseCase;

    @MockitoBean
    private MediaGrpcClientAdapter mediaGrpcClientAdapter;

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
        when(mediaGrpcClientAdapter.getPresignedReadUrl(any())).thenReturn(null);

        mockMvc.perform(put("/api/v1/clinical/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createPatientRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Carlos"))
                .andExpect(jsonPath("$.goal").value("weight-loss"))
                .andExpect(jsonPath("$.profileCompleted").value(true));
    }

    @Test
    void shouldUpdatePatientProfilePhotoAndReturnResolvedUrl() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        PatientProfile profile = createPatientProfile("user-123");
        profile.updateProfilePhoto("user-123/avatar.webp");

        when(manageProfileUseCase.updateProfilePhoto("user-123", "user-123/avatar.webp")).thenReturn(profile);
        when(mediaGrpcClientAdapter.getPresignedReadUrl("user-123/avatar.webp"))
                .thenReturn("https://cdn.example.com/user-123/avatar.webp");

        mockMvc.perform(put("/api/v1/clinical/profile/me/photo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateProfilePhotoRequest("user-123/avatar.webp"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePhotoUrl").value("https://cdn.example.com/user-123/avatar.webp"));
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

        mockMvc.perform(get("/api/v1/clinical/goals/me"))
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
                        .header("X-User-Id", "spoofed-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetCalories").value(2600))
                .andExpect(jsonPath("$.targetWaterGlasses").value(11));

        verify(manageProfileUseCase).updateWeight("user-123", 80.5, targetDate);
    }

    @Test
    void shouldReturnOkWhenEditingWeight() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        LocalDate originalDate = LocalDate.of(2026, 5, 20);
        LocalDate updatedDate = LocalDate.of(2026, 5, 18);
        UpdateWeightRequest request = new UpdateWeightRequest(79.8, updatedDate);

        com.healthcore.clinical.domain.model.HealthGoal mockGoal =
                Mockito.mock(com.healthcore.clinical.domain.model.HealthGoal.class);
        when(mockGoal.targetCalories()).thenReturn(2450);
        when(mockGoal.targetProtein()).thenReturn(150);
        when(mockGoal.targetCarbs()).thenReturn(245);
        when(mockGoal.targetFat()).thenReturn(70);
        when(mockGoal.targetWaterGlasses()).thenReturn(10);

        when(manageProfileUseCase.editWeight(eq("user-123"), eq(originalDate), eq(79.8), eq(updatedDate)))
                .thenReturn(mockGoal);

        mockMvc.perform(put("/api/v1/clinical/weight/{originalDate}", originalDate)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetCalories").value(2450));

        verify(manageProfileUseCase).editWeight("user-123", originalDate, 79.8, updatedDate);
    }

    @Test
    void shouldReturnOkWhenDeletingWeight() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        LocalDate targetDate = LocalDate.of(2026, 5, 18);

        com.healthcore.clinical.domain.model.HealthGoal mockGoal =
                Mockito.mock(com.healthcore.clinical.domain.model.HealthGoal.class);
        when(mockGoal.targetCalories()).thenReturn(2350);
        when(mockGoal.targetProtein()).thenReturn(140);
        when(mockGoal.targetCarbs()).thenReturn(230);
        when(mockGoal.targetFat()).thenReturn(66);
        when(mockGoal.targetWaterGlasses()).thenReturn(10);

        when(manageProfileUseCase.deleteWeight(eq("user-123"), eq(targetDate))).thenReturn(mockGoal);

        mockMvc.perform(delete("/api/v1/clinical/weight/{date}", targetDate)
                        .header("X-User-Id", "spoofed-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetCalories").value(2350));

        verify(manageProfileUseCase).deleteWeight("user-123", targetDate);
    }

    @Test
    void shouldReturnOkAndListWhenGettingWeightHistory() throws Exception {
        setSecurityContext("user-123", "PATIENT");
        List<WeightRecord> history = List.of(
                new WeightRecord(70.0, LocalDate.now().minusDays(10)),
                new WeightRecord(68.5, LocalDate.now())
        );

        when(manageProfileUseCase.getWeightHistory("user-123")).thenReturn(history);

        mockMvc.perform(get("/api/v1/clinical/weight/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].weightKg").value(70.0))
                .andExpect(jsonPath("$[1].weightKg").value(68.5));
    }

    @Test
    void shouldReturnOkAndListWhenGettingNutritionistPatientWeightHistory() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        List<WeightRecord> history = List.of(
                new WeightRecord(72.0, LocalDate.of(2026, 5, 1)),
                new WeightRecord(70.5, LocalDate.of(2026, 5, 15))
        );

        when(manageProfileUseCase.getWeightHistoryForNutritionist("nutri-123", "patient-123")).thenReturn(history);

        mockMvc.perform(get("/api/v1/clinical/nutritionist/patients/patient-123/weight-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].weightKg").value(72.0))
                .andExpect(jsonPath("$[1].weightKg").value(70.5));
    }

    @Test
    void shouldReturnMyProfileWithNutritionistId() throws Exception {
        String patientId = "patient-123";
        setSecurityContext(patientId, "PATIENT");

        PatientProfile mockProfile = createPatientProfile(patientId);
        mockProfile.assignNutritionist("nutri-999");

        when(manageProfileUseCase.getProfileByUserId(patientId)).thenReturn(Optional.of(mockProfile));
        when(mediaGrpcClientAdapter.getPresignedReadUrl(any())).thenReturn(null);

        mockMvc.perform(get("/api/v1/clinical/profile/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(patientId))
                .andExpect(jsonPath("$.firstName").value("Carlos"))
                .andExpect(jsonPath("$.weightKg").value(70.0))
                .andExpect(jsonPath("$.goal").value("weight-loss"))
                .andExpect(jsonPath("$.nutritionistId").value("nutri-999"));
    }

    @Test
    void shouldReturnLinkedNutritionistProfileForPatient() throws Exception {
        String patientId = "patient-123";
        setSecurityContext(patientId, "PATIENT");

        PatientProfile patientProfile = createPatientProfile(patientId);
        patientProfile.assignNutritionist("nutri-123");

        when(manageProfileUseCase.getProfileByUserId(patientId)).thenReturn(Optional.of(patientProfile));
        when(manageProfileUseCase.getNutritionistProfileByUserId("nutri-123"))
                .thenReturn(Optional.of(createNutritionistProfile("nutri-123")));
        when(mediaGrpcClientAdapter.getPresignedReadUrl(any())).thenReturn(null);

        mockMvc.perform(get("/api/v1/clinical/profile/me/nutritionist"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("nutri-123"))
                .andExpect(jsonPath("$.fullName").value("Daniel Martinez"))
                .andExpect(jsonPath("$.professionalLicense").value("12345678"));
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
        when(mediaGrpcClientAdapter.getPresignedReadUrl(any())).thenReturn(null);

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
        when(mediaGrpcClientAdapter.getPresignedReadUrl(any())).thenReturn(null);

        mockMvc.perform(put("/api/v1/clinical/nutritionist/profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createNutritionistRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professionalLicense").value("12345678"));
    }

    @Test
    void shouldUpdateNutritionistProfilePhotoAndReturnResolvedUrl() throws Exception {
        setSecurityContext("nutri-123", "NUTRITIONIST");
        NutritionistProfile profile = createNutritionistProfile("nutri-123");
        profile.updateProfilePhoto("nutri-123/avatar.webp");

        when(manageProfileUseCase.updateNutritionistProfilePhoto("nutri-123", "nutri-123/avatar.webp"))
                .thenReturn(profile);
        when(mediaGrpcClientAdapter.getPresignedReadUrl("nutri-123/avatar.webp"))
                .thenReturn("https://cdn.example.com/nutri-123/avatar.webp");

        mockMvc.perform(put("/api/v1/clinical/nutritionist/profile/me/photo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateProfilePhotoRequest("nutri-123/avatar.webp"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePhotoUrl").value("https://cdn.example.com/nutri-123/avatar.webp"));
    }

    @Test
    void shouldReturnLinkedPatientsForNutritionist() throws Exception {
        String nutritionistId = "nutri-123";
        setSecurityContext(nutritionistId, "NUTRITIONIST");

        PatientProfile patientOne = createPatientProfile("patient-one@example.com");
        patientOne.assignNutritionist(nutritionistId);
        patientOne.updateProfilePhoto("patient-one@example.com/avatar.webp");
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
        patientTwo.updateProfilePhoto("patient-two@example.com/avatar.webp");

        when(manageProfileUseCase.getProfilesByNutritionistId(nutritionistId))
                .thenReturn(List.of(patientOne, patientTwo));
        when(mediaGrpcClientAdapter.getPresignedReadUrls(anyList())).thenReturn(
                java.util.Map.of(
                        "patient-one@example.com/avatar.webp", "https://cdn.example.com/patient-one/avatar.webp",
                        "patient-two@example.com/avatar.webp", "https://cdn.example.com/patient-two/avatar.webp"
                )
        );

        mockMvc.perform(get("/api/v1/clinical/nutritionist/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fullName").value("Carlos Gomez"))
                .andExpect(jsonPath("$[0].profilePhotoUrl").value("https://cdn.example.com/patient-one/avatar.webp"))
                .andExpect(jsonPath("$[1].fullName").value("Maria Lopez"))
                .andExpect(jsonPath("$[1].profilePhotoUrl").value("https://cdn.example.com/patient-two/avatar.webp"));
    }

    @Test
    void shouldReturnLinkedPatientsWithoutFailingWhenPatientHasNoProfilePhoto() throws Exception {
        String nutritionistId = "nutri-123";
        setSecurityContext(nutritionistId, "NUTRITIONIST");

        PatientProfile patientWithoutPhoto = createPatientProfile("patient-one@example.com");
        patientWithoutPhoto.assignNutritionist(nutritionistId);

        PatientProfile patientWithPhoto = createPatientProfile("patient-two@example.com");
        patientWithPhoto.assignNutritionist(nutritionistId);
        patientWithPhoto.updateProfilePhoto("patient-two@example.com/avatar.webp");

        when(manageProfileUseCase.getProfilesByNutritionistId(nutritionistId))
                .thenReturn(List.of(patientWithoutPhoto, patientWithPhoto));
        when(mediaGrpcClientAdapter.getPresignedReadUrls(anyList())).thenReturn(
                java.util.Map.of(
                        "patient-two@example.com/avatar.webp", "https://cdn.example.com/patient-two/avatar.webp"
                )
        );

        mockMvc.perform(get("/api/v1/clinical/nutritionist/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fullName").value("Carlos Gomez"))
                .andExpect(jsonPath("$[0].profilePhotoUrl").value(nullValue()))
                .andExpect(jsonPath("$[1].fullName").value("Carlos Gomez"))
                .andExpect(jsonPath("$[1].profilePhotoUrl").value("https://cdn.example.com/patient-two/avatar.webp"));
    }

    @Test
    void shouldReturnPatientProfileForNutritionist() throws Exception {
        String nutritionistId = "nutri-123";
        String patientId = "patient-one@example.com";
        setSecurityContext(nutritionistId, "NUTRITIONIST");

        PatientProfile patient = createPatientProfile(patientId);
        patient.assignNutritionist(nutritionistId);

        when(manageProfileUseCase.getProfileForNutritionist(nutritionistId, patientId)).thenReturn(patient);
        when(mediaGrpcClientAdapter.getPresignedReadUrl(any())).thenReturn(null);

        mockMvc.perform(get("/api/v1/clinical/nutritionist/patients/{patientId}", patientId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(patientId))
                .andExpect(jsonPath("$.fullName").value("Carlos Gomez"))
                .andExpect(jsonPath("$.nutritionistId").value(nutritionistId));
    }

    @Test
    void shouldUpdatePatientMetricsForNutritionist() throws Exception {
        String nutritionistId = "nutri-123";
        String patientId = "patient-one@example.com";
        setSecurityContext(nutritionistId, "NUTRITIONIST");

        PatientProfile patient = createPatientProfile(patientId);
        patient.assignNutritionist(nutritionistId);
        UpdatePatientMetricsRequest request = new UpdatePatientMetricsRequest(74.5, 180.0);

        when(manageProfileUseCase.updatePatientMetricsForNutritionist(nutritionistId, patientId, 74.5, 180.0))
                .thenReturn(patient);
        when(mediaGrpcClientAdapter.getPresignedReadUrl(any())).thenReturn(null);

        mockMvc.perform(put("/api/v1/clinical/nutritionist/patients/{patientId}/metrics", patientId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(patientId));
    }

    @Test
    void shouldReturnNutritionistWeightProgressReport() throws Exception {
        String nutritionistId = "nutri-123";
        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 22);
        setSecurityContext(nutritionistId, "NUTRITIONIST");

        NutritionistWeightProgressReport report = new NutritionistWeightProgressReport(
                2,
                1,
                List.of(
                        new NutritionistWeightProgressRow(
                                "patient-1",
                                "Ana Lopez",
                                LocalDate.of(2026, 5, 21),
                                72.0,
                                70.5,
                                -1.5,
                                true
                        ),
                        new NutritionistWeightProgressRow(
                                "patient-2",
                                "patient-2",
                                null,
                                null,
                                null,
                                null,
                                false
                        )
                )
        );

        when(manageProfileUseCase.getNutritionistWeightProgressReport(nutritionistId, from, to))
                .thenReturn(report);

        mockMvc.perform(
                        get("/api/v1/clinical/nutritionist/reports/weight-progress")
                                .param("from", from.toString())
                                .param("to", to.toString())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activePatients").value(2))
                .andExpect(jsonPath("$.patientsWithoutWeightInRange").value(1))
                .andExpect(jsonPath("$.rows[0].fullName").value("Ana Lopez"))
                .andExpect(jsonPath("$.rows[0].netChangeKg").value(-1.5))
                .andExpect(jsonPath("$.rows[1].hasRecordsInRange").value(false));
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
                "Especialista en nutricion clinica.",
                null
        );
    }
}

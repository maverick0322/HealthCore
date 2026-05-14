package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class MongoNutritionistProfileRepositoryAdapter implements NutritionistProfileRepositoryPort {

    private final SpringDataMongoNutritionistProfileRepository nutritionistRepository;

    public MongoNutritionistProfileRepositoryAdapter(
            SpringDataMongoNutritionistProfileRepository nutritionistRepository
    ) {
        this.nutritionistRepository = nutritionistRepository;
    }

    @Override
    public NutritionistProfile save(NutritionistProfile profile) {
        NutritionistProfileDocument document = new NutritionistProfileDocument();
        document.setUserId(profile.getUserId());
        document.setFirstName(profile.getFirstName());
        document.setPaternalLastName(profile.getPaternalLastName());
        document.setMaternalLastName(profile.getMaternalLastName());
        document.setSpecializations(profile.getSpecializations());
        document.setCustomSpecialization(profile.getCustomSpecialization());
        document.setProfessionalLicense(profile.getProfessionalLicense());
        document.setConsultationTypes(profile.getConsultationTypes());
        document.setPhone(profile.getPhone());
        document.setClinicAddress(mapClinicAddress(profile.getClinicAddress()));
        document.setBio(profile.getBio());

        nutritionistRepository.save(document);
        return profile;
    }

    @Override
    public Optional<NutritionistProfile> findByUserId(String userId) {
        return nutritionistRepository.findById(userId).map(this::mapNutritionistDocumentToDomain);
    }

    private NutritionistProfile mapNutritionistDocumentToDomain(NutritionistProfileDocument doc) {
        return NutritionistProfile.rehydrate(
                doc.getUserId(),
                doc.getFirstName(),
                doc.getPaternalLastName(),
                doc.getMaternalLastName(),
                doc.getSpecializations(),
                doc.getCustomSpecialization(),
                doc.getProfessionalLicense(),
                doc.getConsultationTypes(),
                doc.getPhone(),
                mapClinicAddress(doc.getClinicAddress()),
                doc.getBio()
        );
    }

    private ClinicAddressDocument mapClinicAddress(ClinicAddress clinicAddress) {
        if (clinicAddress == null) {
            return null;
        }
        ClinicAddressDocument document = new ClinicAddressDocument();
        document.setPostalCode(clinicAddress.getPostalCode());
        document.setState(clinicAddress.getState());
        document.setCity(clinicAddress.getCity());
        document.setNeighborhood(clinicAddress.getNeighborhood());
        document.setStreet(clinicAddress.getStreet());
        document.setExteriorNumber(clinicAddress.getExteriorNumber());
        document.setInteriorNumber(clinicAddress.getInteriorNumber());
        return document;
    }

    private ClinicAddress mapClinicAddress(ClinicAddressDocument document) {
        if (document == null) {
            return null;
        }
        return ClinicAddress.rehydrate(
                document.getPostalCode(),
                document.getState(),
                document.getCity(),
                document.getNeighborhood(),
                document.getStreet(),
                document.getExteriorNumber(),
                document.getInteriorNumber()
        );
    }
}

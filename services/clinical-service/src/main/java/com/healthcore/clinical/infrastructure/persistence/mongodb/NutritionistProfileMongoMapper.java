package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import org.springframework.stereotype.Component;

@Component
public class NutritionistProfileMongoMapper {

    public NutritionistProfileDocument toDocument(NutritionistProfile profile) {
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
        document.setClinicAddress(toClinicAddressDocument(profile.getClinicAddress()));
        document.setBio(profile.getBio());
        document.setProfilePhotoKey(profile.getProfilePhotoKey());
        return document;
    }

    public NutritionistProfile toDomain(NutritionistProfileDocument document) {
        return NutritionistProfile.rehydrate(
                document.getUserId(),
                document.getFirstName(),
                document.getPaternalLastName(),
                document.getMaternalLastName(),
                document.getSpecializations(),
                document.getCustomSpecialization(),
                document.getProfessionalLicense(),
                document.getConsultationTypes(),
                document.getPhone(),
                toClinicAddress(document.getClinicAddress()),
                document.getBio(),
                document.getProfilePhotoKey()
        );
    }

    private ClinicAddressDocument toClinicAddressDocument(ClinicAddress clinicAddress) {
        if (clinicAddress == null) {
            return null;
        }
        ClinicAddressDocument document = new ClinicAddressDocument();
        document.setPostalCode(clinicAddress.getPostalCode());
        document.setState(clinicAddress.getState());
        document.setCity(clinicAddress.getCity());
        document.setMunicipality(clinicAddress.getMunicipality());
        document.setNeighborhood(clinicAddress.getNeighborhood());
        document.setStreet(clinicAddress.getStreet());
        document.setExteriorNumber(clinicAddress.getExteriorNumber());
        document.setInteriorNumber(clinicAddress.getInteriorNumber());
        return document;
    }

    private ClinicAddress toClinicAddress(ClinicAddressDocument document) {
        if (document == null) {
            return null;
        }
        return ClinicAddress.rehydrate(
                document.getPostalCode(),
                document.getState(),
                document.getCity(),
                document.getMunicipality(),
                document.getNeighborhood(),
                document.getStreet(),
                document.getExteriorNumber(),
                document.getInteriorNumber()
        );
    }
}

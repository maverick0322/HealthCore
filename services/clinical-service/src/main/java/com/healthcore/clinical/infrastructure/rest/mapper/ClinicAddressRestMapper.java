package com.healthcore.clinical.infrastructure.rest.mapper;

import org.springframework.stereotype.Component;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressResponse;

@Component
public class ClinicAddressRestMapper {

    public ClinicAddress toDomain(ClinicAddressRequest request) {
        if (request == null) {
            return null;
        }
        return ClinicAddress.rehydrate(
                request.postalCode(),
                request.state(),
                request.city(),
                request.municipality(),
                request.neighborhood(),
                request.street(),
                request.exteriorNumber(),
                request.interiorNumber()
        );
    }

    public ClinicAddressResponse toResponse(ClinicAddress address) {
        if (address == null) {
            return null;
        }
        return new ClinicAddressResponse(
                address.getPostalCode(),
                address.getState(),
                address.getCity(),
                address.getMunicipality(),
                address.getNeighborhood(),
                address.getStreet(),
                address.getExteriorNumber(),
                address.getInteriorNumber()
        );
    }
}

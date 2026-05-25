package com.healthcore.agenda_service.infrastructure.grpc;

import com.healthcore.agenda.grpc.AgendaLifecycleGrpc;
import com.healthcore.agenda.grpc.CancelFutureAppointmentsForUnlinkRequest;
import com.healthcore.agenda.grpc.CancelFutureAppointmentsForUnlinkResponse;
import com.healthcore.agenda_service.application.CancelFutureAppointmentsResult;
import com.healthcore.agenda_service.application.PatientAppointmentService;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Component;

@Component
public class AgendaLifecycleGrpcService extends AgendaLifecycleGrpc.AgendaLifecycleImplBase {

    private final PatientAppointmentService patientAppointmentService;

    public AgendaLifecycleGrpcService(PatientAppointmentService patientAppointmentService) {
        this.patientAppointmentService = patientAppointmentService;
    }

    @Override
    public void cancelFutureAppointmentsForUnlink(
        CancelFutureAppointmentsForUnlinkRequest request,
        StreamObserver<CancelFutureAppointmentsForUnlinkResponse> responseObserver
    ) {
        CancelFutureAppointmentsResult result = patientAppointmentService.cancelFutureAppointmentsForUnlink(
            request.getPatientId(),
            request.getNutritionistId(),
            request.getActor(),
            request.getReason()
        );

        responseObserver.onNext(CancelFutureAppointmentsForUnlinkResponse.newBuilder()
            .setCancelledCount(result.cancelledCount())
            .setReleasedSlotCount(result.releasedSlotCount())
            .build());
        responseObserver.onCompleted();
    }
}

package com.healthcore.clinical.infrastructure.agenda;

import com.healthcore.agenda.grpc.AgendaLifecycleGrpc;
import com.healthcore.agenda.grpc.CancelFutureAppointmentsForUnlinkRequest;
import com.healthcore.clinical.domain.exception.AgendaServiceUnavailableException;
import com.healthcore.clinical.domain.port.out.AgendaLifecyclePort;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class GrpcAgendaLifecycleClient implements AgendaLifecyclePort {

    private static final int GRPC_TIMEOUT_SECONDS = 5;
    private static final Logger log = LoggerFactory.getLogger(GrpcAgendaLifecycleClient.class);

    private final AgendaLifecycleGrpc.AgendaLifecycleBlockingStub agendaStub;
    private final ManagedChannel managedChannel;

    @Autowired
    public GrpcAgendaLifecycleClient(@Value("${grpc.agenda.target:agenda-service:50052}") String grpcTarget) {
        log.info("Initializing gRPC client for Agenda Service at target: {}", grpcTarget);
        this.managedChannel = ManagedChannelBuilder.forTarget(grpcTarget)
            .usePlaintext()
            .build();
        this.agendaStub = AgendaLifecycleGrpc.newBlockingStub(managedChannel);
    }

    public GrpcAgendaLifecycleClient(AgendaLifecycleGrpc.AgendaLifecycleBlockingStub agendaStub) {
        this.agendaStub = agendaStub;
        this.managedChannel = null;
    }

    @Override
    public void cancelFutureAppointmentsForUnlink(String patientId, String nutritionistId, String actor, String reason) {
        try {
            agendaStub.withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .cancelFutureAppointmentsForUnlink(CancelFutureAppointmentsForUnlinkRequest.newBuilder()
                    .setPatientId(patientId)
                    .setNutritionistId(nutritionistId)
                    .setActor(actor)
                    .setReason(reason)
                    .build());
        } catch (StatusRuntimeException ex) {
            throw unavailable(ex);
        } catch (Exception ex) {
            throw unavailable(ex);
        }
    }

    @PreDestroy
    void shutdown() {
        if (managedChannel != null) {
            managedChannel.shutdown();
        }
    }

    private AgendaServiceUnavailableException unavailable(Exception ex) {
        log.warn("Agenda unlink cleanup failed", ex);
        return new AgendaServiceUnavailableException(
            "No fue posible cancelar las citas futuras antes de desvincular",
            ex
        );
    }
}

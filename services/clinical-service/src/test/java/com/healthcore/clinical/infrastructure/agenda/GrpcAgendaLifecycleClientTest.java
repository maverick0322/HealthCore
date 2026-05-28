package com.healthcore.clinical.infrastructure.agenda;

import com.healthcore.agenda.grpc.AgendaLifecycleGrpc;
import com.healthcore.agenda.grpc.CancelFutureAppointmentsForUnlinkRequest;
import com.healthcore.agenda.grpc.CancelFutureAppointmentsForUnlinkResponse;
import com.healthcore.clinical.domain.exception.AgendaServiceUnavailableException;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GrpcAgendaLifecycleClientTest {

    @Mock
    private AgendaLifecycleGrpc.AgendaLifecycleBlockingStub agendaStub;

    @Mock
    private AgendaLifecycleGrpc.AgendaLifecycleBlockingStub deadlineStub;

    @Test
    void shouldSendUnlinkCancellationRequestWithConfiguredDeadline() {
        GrpcAgendaLifecycleClient client = new GrpcAgendaLifecycleClient(agendaStub);

        when(agendaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.cancelFutureAppointmentsForUnlink(any(CancelFutureAppointmentsForUnlinkRequest.class)))
                .thenReturn(CancelFutureAppointmentsForUnlinkResponse.getDefaultInstance());

        client.cancelFutureAppointmentsForUnlink("patient-1", "nutri-1", "patient-1", "PATIENT_UNLINKED");

        ArgumentCaptor<CancelFutureAppointmentsForUnlinkRequest> requestCaptor =
                ArgumentCaptor.forClass(CancelFutureAppointmentsForUnlinkRequest.class);
        verify(deadlineStub).cancelFutureAppointmentsForUnlink(requestCaptor.capture());

        CancelFutureAppointmentsForUnlinkRequest request = requestCaptor.getValue();
        assertEquals("patient-1", request.getPatientId());
        assertEquals("nutri-1", request.getNutritionistId());
        assertEquals("patient-1", request.getActor());
        assertEquals("PATIENT_UNLINKED", request.getReason());
    }

    @Test
    void shouldWrapGrpcStatusFailuresAsAgendaServiceUnavailableException() {
        GrpcAgendaLifecycleClient client = new GrpcAgendaLifecycleClient(agendaStub);
        StatusRuntimeException grpcFailure = new StatusRuntimeException(Status.UNAVAILABLE);

        when(agendaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.cancelFutureAppointmentsForUnlink(any(CancelFutureAppointmentsForUnlinkRequest.class)))
                .thenThrow(grpcFailure);

        AgendaServiceUnavailableException exception = assertThrows(
                AgendaServiceUnavailableException.class,
                () -> client.cancelFutureAppointmentsForUnlink("patient-1", "nutri-1", "patient-1", "PATIENT_UNLINKED")
        );

        assertEquals("No fue posible cancelar las citas futuras antes de desvincular", exception.getMessage());
        assertEquals(grpcFailure, exception.getCause());
    }

    @Test
    void shouldWrapUnexpectedFailuresAsAgendaServiceUnavailableException() {
        GrpcAgendaLifecycleClient client = new GrpcAgendaLifecycleClient(agendaStub);
        RuntimeException unexpectedFailure = new RuntimeException("boom");

        when(agendaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.cancelFutureAppointmentsForUnlink(any(CancelFutureAppointmentsForUnlinkRequest.class)))
                .thenThrow(unexpectedFailure);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> client.cancelFutureAppointmentsForUnlink("patient-1", "nutri-1", "patient-1", "PATIENT_UNLINKED")
        );

        assertInstanceOf(AgendaServiceUnavailableException.class, exception);
        assertEquals(unexpectedFailure, exception.getCause());
    }
}

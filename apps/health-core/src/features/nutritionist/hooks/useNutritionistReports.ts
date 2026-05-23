import { useQuery } from '@tanstack/react-query';

import { clinicalApi } from '@/features/clinical/services/clinicalService';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { nutritionistAgendaService } from '@/features/nutritionist/services/nutritionistAgendaService';
import { getCalendarMonthRange, summarizeAppointments } from '@/features/nutritionist/utils/reporting';
import type {
  NutritionistReportRangeKey,
  NutritionistReportsData,
} from '@/features/nutritionist/types/report.types';

export const NUTRITIONIST_REPORTS_QUERY_KEY = ['nutritionist-reports'];

export const useNutritionistReports = (rangeKey: NutritionistReportRangeKey) => {
  const user = useAuthStore((state) => state.user);
  const period = getCalendarMonthRange(rangeKey);

  return useQuery<NutritionistReportsData>({
    queryKey: [...NUTRITIONIST_REPORTS_QUERY_KEY, user?.email ?? null, rangeKey],
    queryFn: async () => {
      const [weightReport, appointments, deactivatedSlots] = await Promise.all([
        clinicalApi.getNutritionistWeightProgressReport(period.fromDateKey, period.toDateKey),
        nutritionistAgendaService.getAppointmentReport(
          period.fromIso,
          period.toIso,
          ['PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED']
        ),
        nutritionistAgendaService.getSlotReport(period.fromIso, period.toIso, 'inactive'),
      ]);

      return {
        period,
        appointments,
        deactivatedSlots,
        appointmentSummary: summarizeAppointments(appointments),
        weightReport,
      };
    },
  });
};

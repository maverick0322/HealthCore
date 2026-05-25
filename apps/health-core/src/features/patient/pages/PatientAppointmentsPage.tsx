import { useTranslation } from 'react-i18next';
import { Calendar, CalendarCheck, History, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { PatientNav } from '@/features/patient/components/PatientNav';
import { WeeklyCalendar } from '@/features/agenda/components/WeeklyCalendar';

import { usePatientAppointmentsPage } from '../hooks/usePatientAppointmentsPage';
import {
  AppointmentListItem,
  CancelAppointmentDialog,
  LinkedNutritionistBanner,
  RescheduleAppointmentDialog,
  SlotBookingCard,
} from '../components/AppointmentComponents';

export const PatientAppointmentsPage = () => {
  const { t } = useTranslation('patient');

  const {
    // Tab
    activeTab,
    setActiveTab,
    // Calendar navigation
    weekStart,
    selectedDate,
    setSelectedDate,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    // Data
    appointments,
    historyAppointments,
    availabilityItems,
    // Loading / error
    loadingAppts,
    apptError,
    loadingHistory,
    historyError,
    loadingSlots,
    slotError,
    loadingProfile,
    profileError,
    // Nutritionist
    linkedNutritionistId,
    nutritionistName,
    nutritionistSpecializations,
    // Dialog state
    selectedSlot,
    cancelTarget,
    setCancelTarget,
    rescheduleTarget,
    setRescheduleTarget,
    rescheduleSlot,
    toast,
    // Actions
    fetchAppointments,
    fetchHistoryAppointments,
    handleBook,
    handleCancel,
    handleReschedule,
    handleSearchSlots,
    openRescheduleFor,
    selectCalendarItem,
    navigateToScan,
    // Loading flags
    booking,
    cancelling,
    rescheduling,
  } = usePatientAppointmentsPage();

  const calendarLabels = {
    previous: t('appointments.calendar.previousWeek'),
    next: t('appointments.calendar.nextWeek'),
    today: t('appointments.calendar.today'),
    empty: t('appointments.noAvailableTimes'),
    loading: t('appointments.loadingSlots'),
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <PatientNav />
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="border-b border-border bg-primary/10 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('appointments.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('appointments.subtitle')}</p>
        </div>
      </div>

      {toast && (
        <div className="md:pl-56 px-4 sm:px-6">
          <div
            className={`max-w-7xl mx-auto mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                : 'bg-destructive/10 text-destructive border border-destructive/25'
            }`}
          >
            {/* The icon is rendered by the component that matches the type of toast (success vs error) */}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="md:pl-56 px-4 sm:px-6 pt-4">
        <div className="max-w-7xl mx-auto flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          <button
            key="appointments"
            id="tab-appointments"
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'appointments'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('appointments.tabMyAppointments')}
          </button>
          <button
            key="schedule"
            id="tab-schedule"
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('appointments.tabSchedule')}
          </button>
          <button
            key="history"
            id="tab-history"
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('appointments.history')}
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-8 md:pl-56">
        {activeTab === 'appointments' && (
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarCheck size={18} className="text-primary" />
                  {t('appointments.tabMyAppointments')}
                </CardTitle>
                <Button id="btn-refresh-appts" variant="ghost" size="icon" onClick={fetchAppointments} disabled={loadingAppts}>
                  <RefreshCw size={16} className={loadingAppts ? 'animate-spin' : ''} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAppts && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">{t('appointments.loadingAppointments')}</span>
                </div>
              )}

              {apptError && !loadingAppts && (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <p className="text-sm">{apptError}</p>
                  <Button size="sm" variant="outline" onClick={fetchAppointments}>{t('appointments.retry')}</Button>
                </div>
              )}

              {!loadingAppts && !apptError && appointments.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Calendar size={32} className="opacity-40" />
                  <p className="text-sm">{t('appointments.noAppointments')}</p>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('schedule')}>
                    {t('appointments.scheduleNew')}
                  </Button>
                </div>
              )}

              {!loadingAppts && !apptError && appointments.length > 0 && (
                <div className="divide-y divide-border/50">
                  {appointments.map((appt) => (
                    <AppointmentListItem
                      key={appt.id}
                      appointment={appt}
                      onCancel={setCancelTarget}
                      onReschedule={openRescheduleFor}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History size={18} className="text-primary" />
                  {t('appointments.history')}
                </CardTitle>
                <Button
                  id="btn-refresh-history"
                  variant="ghost"
                  size="icon"
                  onClick={fetchHistoryAppointments}
                  disabled={loadingHistory}
                >
                  <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingHistory && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">{t('appointments.loadingHistory')}</span>
                </div>
              )}

              {historyError && !loadingHistory && (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <p className="text-sm">{historyError}</p>
                  <Button size="sm" variant="outline" onClick={fetchHistoryAppointments}>{t('appointments.retry')}</Button>
                </div>
              )}

              {!loadingHistory && !historyError && historyAppointments.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Calendar size={32} className="opacity-40" />
                  <p className="text-sm">{t('appointments.noHistory')}</p>
                </div>
              )}

              {!loadingHistory && !historyError && historyAppointments.length > 0 && (
                <div className="divide-y divide-border/50">
                  {historyAppointments.map((appt) => (
                    <AppointmentListItem
                      key={appt.id}
                      appointment={appt}
                      onCancel={setCancelTarget}
                      onReschedule={openRescheduleFor}
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <LinkedNutritionistBanner
                  loadingProfile={loadingProfile}
                  profileError={profileError}
                  linkedNutritionistId={linkedNutritionistId}
                  nutritionistName={nutritionistName}
                  nutritionistSpecializations={nutritionistSpecializations}
                  selectedDate={selectedDate}
                  loadingSlots={loadingSlots}
                  onDateChange={setSelectedDate}
                  onSearchSlots={handleSearchSlots}
                  onLinkNutritionist={navigateToScan}
                />
              </CardContent>
            </Card>

            {slotError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {slotError}
              </div>
            )}

            <WeeklyCalendar
              title={t('appointments.selectTime')}
              weekStart={weekStart}
              items={availabilityItems}
              labels={calendarLabels}
              isLoading={loadingSlots}
              onPreviousWeek={goToPreviousWeek}
              onNextWeek={goToNextWeek}
              onToday={goToToday}
              onItemClick={(item) => selectCalendarItem(item, 'book')}
            />

            {selectedSlot && (
              <SlotBookingCard
                slot={selectedSlot}
                booking={booking}
                onBook={handleBook}
              />
            )}
          </div>
        )}
      </main>

      <CancelAppointmentDialog
        target={cancelTarget}
        cancelling={cancelling}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />

      <RescheduleAppointmentDialog
        target={rescheduleTarget}
        rescheduleSlot={rescheduleSlot}
        rescheduling={rescheduling}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={handleReschedule}
      >
        <WeeklyCalendar
          title={t('appointments.selectTime')}
          weekStart={weekStart}
          items={availabilityItems}
          labels={calendarLabels}
          isLoading={loadingSlots}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onToday={goToToday}
          onItemClick={(item) => selectCalendarItem(item, 'reschedule')}
        />
      </RescheduleAppointmentDialog>
    </div>
  );
};

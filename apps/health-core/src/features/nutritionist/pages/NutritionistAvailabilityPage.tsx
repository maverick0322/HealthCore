import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';

import { NutritionistNav } from '@/features/nutritionist/components/NutritionistNav';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { WeeklyCalendar, type WeeklyCalendarItem } from '@/features/agenda/components/WeeklyCalendar';
import {
  addDays,
  formatLocalTime,
  getWeekDays,
  startOfWeek,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';
import { useNutritionistAvailabilityPage } from '../hooks/useNutritionistAvailabilityPage';
import {
  ActivateSlotDialog,
  DayBlockEditor,
  DaySelector,
  DeactivateSlotDialog,
} from '../components/NutritionistAvailabilityComponents';
import { useMemo } from 'react';

export const NutritionistAvailabilityPage = () => {
  const { t } = useTranslation('nutritionist');
  const navigate = useNavigate();

  const {
    activeTab,
    setActiveTab,
    weekStart,
    selectedDays,
    duration,
    setDuration,
    deactivateTarget,
    setDeactivateTarget,
    activateTarget,
    setActivateTarget,
    toast,
    browserTimeZone,
    slots,
    generatedSlots,
    loadingSlots,
    slotError,
    generating,
    genError,
    genSuccess,
    deactivating,
    activating,
    handleFetchSlots,
    goToWeek,
    toggleSelectedDay,
    blocksForDay,
    updateDayBlock,
    addDayBlock,
    removeDayBlock,
    handleGenerate,
    handleDeactivate,
    handleActivate,
    handleSlotCalendarItemClick,
    EARLIEST_SLOT_TIME,
    LATEST_SLOT_TIME,
  } = useNutritionistAvailabilityPage();

  const calendarLabels = {
    previous: t('availability.calendar.previousWeek'),
    next: t('availability.calendar.nextWeek'),
    today: t('availability.calendar.today'),
    empty: t('availability.noSlots'),
    loading: t('availability.loadingSlots'),
  };

  const generatedCalendarLabels = {
    ...calendarLabels,
    empty: t('availability.noGeneratedPreview'),
  };

  const slotItems = useMemo<WeeklyCalendarItem[]>(
    () =>
      slots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: slot.active
          ? slot.reserved ? t('availability.reserved') : t('availability.free')
          : t('availability.inactive'),
        subtitle: `${formatLocalTime(slot.startTime)} - ${formatLocalTime(slot.endTime)}`,
        kind: slot.active ? slot.reserved ? 'reserved' : 'available' : 'inactive',
      })),
    [slots, t],
  );

  const generatedItems = useMemo<WeeklyCalendarItem[]>(
    () =>
      generatedSlots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: t('availability.generatedSlot'),
        subtitle: `${formatLocalTime(slot.startTime)} - ${formatLocalTime(slot.endTime)}`,
        kind: 'available',
      })),
    [generatedSlots, t],
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans transition-colors duration-500 ease-in-out">
      <NutritionistNav />
      <div className="md:pl-56">
        <SettingsBar />
      </div>

      <div className="border-b border-border bg-primary/10 md:pl-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6 flex flex-col">
          <Button variant="ghost" size="sm" onClick={() => navigate('/agenda/nutritionist')} className="w-fit mb-4 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft size={16} className="mr-1.5" />
            {t('availability.back')}
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('availability.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('availability.subtitle')}</p>
        </div>
      </div>

      {toast && (
        <div className="md:pl-56 px-4 sm:px-6">
          <div className={`max-w-7xl mx-auto mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
            : 'bg-destructive/10 text-destructive border border-destructive/25'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="md:pl-56 px-4 sm:px-6 pt-4">
        <div className="max-w-7xl mx-auto flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          <button
            key="generate"
            id="tab-generate"
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'generate'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {t('availability.tabGenerate')}
          </button>
          <button
            key="mySlots"
            id="tab-mySlots"
            type="button"
            onClick={() => setActiveTab('mySlots')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'mySlots'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {t('availability.tabMySlots')}
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pl-56 space-y-6">
        {activeTab === 'generate' && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary" />
                    {t('availability.selectDays')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => goToWeek(addDays(weekStart, -7))}>
                      {t('availability.calendar.previousWeek')}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => goToWeek(startOfWeek(todayDateKey()))}>
                      {t('availability.calendar.today')}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => goToWeek(addDays(weekStart, 7))}>
                      {t('availability.calendar.nextWeek')}
                    </Button>
                  </div>

                  <DaySelector
                    dateKeys={getWeekDays(weekStart)}
                    selectedDays={selectedDays}
                    todayDateKey={todayDateKey()}
                    onToggleDay={toggleSelectedDay}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap size={18} className="text-primary" />
                    {t('availability.generateTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gen-duration">{t('availability.appointmentDuration')}</Label>
                    <Input
                      id="gen-duration"
                      type="number"
                      min={15}
                      step={5}
                      value={duration}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDuration(Number(event.target.value))}
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{t('availability.timeZone')}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground break-all">{browserTimeZone}</p>
                  </div>

                  {genError && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      {genError}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base">{t('availability.dayBlocks')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {selectedDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('availability.selectAtLeastOneDay')}</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {[...selectedDays].sort().map((dateKey) => (
                        <DayBlockEditor
                          key={dateKey}
                          dateKey={dateKey}
                          blocks={blocksForDay(dateKey)}
                          earliestTime={EARLIEST_SLOT_TIME}
                          latestTime={LATEST_SLOT_TIME}
                          onUpdateBlock={(index, field, value) => updateDayBlock(dateKey, index, field, value)}
                          onAddBlock={() => addDayBlock(dateKey)}
                          onRemoveBlock={(index) => removeDayBlock(dateKey, index)}
                        />
                      ))}
                    </div>

                    <Button id="btn-generate" className="w-full" onClick={handleGenerate} disabled={generating}>
                      {generating ? (
                        <>
                          <Loader2 size={14} className="animate-spin mr-2" />
                          {t('availability.generating')}
                        </>
                      ) : (
                        <>
                          <Zap size={14} className="mr-2" />
                          {t('availability.generateBtn')}
                        </>
                      )}
                    </Button>

                    {genError && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        {genError}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {genSuccess && (
              <WeeklyCalendar
                title={t('availability.generatedPreview')}
                weekStart={weekStart}
                items={generatedItems}
                labels={generatedCalendarLabels}
                onPreviousWeek={() => goToWeek(addDays(weekStart, -7))}
                onNextWeek={() => goToWeek(addDays(weekStart, 7))}
                onToday={() => goToWeek(startOfWeek(todayDateKey()))}
              />
            )}
          </>
        )}

        {activeTab === 'mySlots' && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">{t('availability.mySlotsTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('availability.mySlotsSubtitle')}</p>
              </div>
              <Button id="btn-search-slots" onClick={() => handleFetchSlots()} disabled={loadingSlots}>
                {loadingSlots ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <RefreshCw size={14} className="mr-2" />
                    {t('availability.searchSlots')}
                  </>
                )}
              </Button>
            </div>

            {slotError && !loadingSlots && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle size={16} />
                {slotError}
              </div>
            )}

            <WeeklyCalendar
              title={t('availability.mySlotsTitle')}
              weekStart={weekStart}
              items={slotItems}
              labels={calendarLabels}
              isLoading={loadingSlots}
              onPreviousWeek={() => goToWeek(addDays(weekStart, -7))}
              onNextWeek={() => goToWeek(addDays(weekStart, 7))}
              onToday={() => goToWeek(startOfWeek(todayDateKey()))}
              onItemClick={(item) => {
                handleSlotCalendarItemClick(slots.find((candidate) => candidate.id === item.id));
              }}
            />
          </>
        )}
      </main>

      <DeactivateSlotDialog
        target={deactivateTarget}
        deactivating={deactivating}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
      <ActivateSlotDialog
        target={activateTarget}
        activating={activating}
        onClose={() => setActivateTarget(null)}
        onConfirm={handleActivate}
      />
    </div>
  );
};

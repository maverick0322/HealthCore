import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react';

import { NutritionistNav } from '@/features/nutritionist/components/NutritionistNav';
import { SettingsBar } from '@/shared/components/SettingsBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { WeeklyCalendar, type WeeklyCalendarItem } from '@/features/agenda/components/WeeklyCalendar';
import {
  addDays,
  formatLocalDate,
  formatLocalTime,
  getBrowserTimeZone,
  getWeekDays,
  getWeekRange,
  startOfWeek,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';

import { useGenerateSlots } from '@/features/nutritionist/hooks/useGenerateSlots';
import { useNutritionistSlots } from '@/features/nutritionist/hooks/useNutritionistSlots';
import { useDeactivateSlot } from '@/features/nutritionist/hooks/useDeactivateSlot';
import type {
  AvailabilitySlotResponse,
  GenerateSlotsTimeBlock,
} from '@/features/nutritionist/types/agenda.types';

type Tab = 'generate' | 'mySlots';
type DayBlocksByDate = Record<string, GenerateSlotsTimeBlock[]>;
const EARLIEST_SLOT_TIME = '06:00';
const LATEST_SLOT_TIME = '21:00';

const toTimeInputValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const getNextQuarterHour = () => {
  const date = new Date();
  date.setMinutes(Math.ceil((date.getMinutes() + 5) / 15) * 15, 0, 0);
  return date;
};

const defaultBlock = (preferFutureToday = false): GenerateSlotsTimeBlock => {
  if (!preferFutureToday) {
    return { startTime: '09:00', endTime: '13:00' };
  }
  const start = getNextQuarterHour();
  if (toTimeInputValue(start) < EARLIEST_SLOT_TIME) {
    start.setHours(6, 0, 0, 0);
  }
  if (toTimeInputValue(start) >= LATEST_SLOT_TIME) {
    return { startTime: '09:00', endTime: '13:00' };
  }
  const preferredEnd = new Date(start);
  preferredEnd.setHours(start.getHours() + 4, start.getMinutes(), 0, 0);
  const latestEnd = new Date(start);
  latestEnd.setHours(21, 0, 0, 0);
  const end = preferredEnd > latestEnd ? latestEnd : preferredEnd;
  return { startTime: toTimeInputValue(start), endTime: toTimeInputValue(end) };
};

const getInitialSelectedDateKey = () => {
  const now = new Date();
  return now.getHours() >= 21 ? addDays(todayDateKey(), 1) : todayDateKey();
};

const createInitialScheduleState = () => {
  const initialDate = getInitialSelectedDateKey();
  return {
    selectedDays: [initialDate],
    dayBlocks: {
      [initialDate]: [defaultBlock(initialDate === todayDateKey())],
    },
  };
};

const sortBlocks = (blocks: GenerateSlotsTimeBlock[]) =>
  [...blocks].sort((left, right) => left.startTime.localeCompare(right.startTime));

const hasOverlappingBlocks = (blocks: GenerateSlotsTimeBlock[]) => {
  const sorted = sortBlocks(blocks);
  return sorted.some((block, index) => index > 0 && block.startTime < sorted[index - 1].endTime);
};

const hasInvalidBlockOrder = (blocks: GenerateSlotsTimeBlock[]) =>
  blocks.some((block) => !block.startTime || !block.endTime || block.startTime >= block.endTime);

const hasBlockOutsideVisibleHours = (blocks: GenerateSlotsTimeBlock[]) =>
  blocks.some((block) => block.startTime < EARLIEST_SLOT_TIME || block.endTime > LATEST_SLOT_TIME);

const hasPastSameDayBlock = (dateKey: string, blocks: GenerateSlotsTimeBlock[]) => {
  if (dateKey !== todayDateKey()) return false;
  const now = new Date();
  return blocks.some((block) => {
    const [hours, minutes] = block.startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    return start <= now;
  });
};

export const NutritionistAvailabilityPage = () => {
  const { t } = useTranslation('nutritionist');
  const navigate = useNavigate();

  const initialSchedule = useMemo(createInitialScheduleState, []);
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [weekStart, setWeekStart] = useState(startOfWeek(todayDateKey()));
  const [selectedDays, setSelectedDays] = useState<string[]>(initialSchedule.selectedDays);
  const [dayBlocks, setDayBlocks] = useState<DayBlocksByDate>(initialSchedule.dayBlocks);
  const [duration, setDuration] = useState(45);
  const [deactivateTarget, setDeactivateTarget] = useState<AvailabilitySlotResponse | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const { generateSlots, isLoading: generating, error: genError, isSuccess: genSuccess, slots: generatedSlots } = useGenerateSlots();
  const { slots, isLoading: loadingSlots, error: slotError, fetchSlots } = useNutritionistSlots();
  const { deactivateSlot, isLoading: deactivating } = useDeactivateSlot();

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'mySlots') {
      handleFetchSlots();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleFetchSlots = (targetWeek = weekStart) => {
    const range = getWeekRange(targetWeek);
    fetchSlots(range.from, range.to);
  };

  const goToWeek = (targetWeek: string) => {
    setWeekStart(targetWeek);
    if (activeTab === 'mySlots') {
      handleFetchSlots(targetWeek);
    }
  };

  const toggleSelectedDay = (dateKey: string) => {
    setSelectedDays((current) => {
      if (current.includes(dateKey)) {
        const next = current.filter((day) => day !== dateKey);
        setDayBlocks((blocksByDate) => {
          const copy = { ...blocksByDate };
          delete copy[dateKey];
          return copy;
        });
        return next;
      }
      setDayBlocks((blocksByDate) => ({
        ...blocksByDate,
        [dateKey]: blocksByDate[dateKey] ?? [defaultBlock(dateKey === todayDateKey())],
      }));
      return [...current, dateKey].sort();
    });
  };

  const blocksForDay = (dateKey: string) => dayBlocks[dateKey] ?? [];

  const updateDayBlock = (
    dateKey: string,
    index: number,
    field: keyof GenerateSlotsTimeBlock,
    value: string,
  ) => {
    setDayBlocks((current) => {
      const blocks = current[dateKey] ?? [defaultBlock(dateKey === todayDateKey())];
      return {
        ...current,
        [dateKey]: blocks.map((block, blockIndex) => (
          blockIndex === index ? { ...block, [field]: value } : block
        )),
      };
    });
  };

  const addDayBlock = (dateKey: string) => {
    setDayBlocks((current) => ({
      ...current,
      [dateKey]: [...(current[dateKey] ?? []), defaultBlock(dateKey === todayDateKey())],
    }));
  };

  const removeDayBlock = (dateKey: string, index: number) => {
    setDayBlocks((current) => {
      const blocks = current[dateKey] ?? [];
      if (blocks.length === 1) return current;
      return {
        ...current,
        [dateKey]: blocks.filter((_, blockIndex) => blockIndex !== index),
      };
    });
  };

  const handleGenerate = async () => {
    if (selectedDays.length === 0) {
      setToast({ msg: t('availability.selectAtLeastOneDay'), type: 'error' });
      return;
    }
    if (duration < 15) {
      setToast({ msg: t('availability.invalidDuration'), type: 'error' });
      return;
    }
    for (const date of selectedDays) {
      const blocks = blocksForDay(date);
      if (blocks.length === 0 || hasInvalidBlockOrder(blocks)) {
        setToast({ msg: t('availability.invalidBlocks'), type: 'error' });
        return;
      }
      if (hasOverlappingBlocks(blocks)) {
        setToast({ msg: t('availability.overlappingBlocks'), type: 'error' });
        return;
      }
      if (hasBlockOutsideVisibleHours(blocks)) {
        setToast({ msg: t('availability.outsideVisibleHours'), type: 'error' });
        return;
      }
      if (hasPastSameDayBlock(date, blocks)) {
        setToast({ msg: t('availability.pastTimeBlocks'), type: 'error' });
        return;
      }
    }

    try {
      const sortedSelectedDays = [...selectedDays].sort();
      const firstGeneratedWeek = startOfWeek(sortedSelectedDays[0]);
      const data = await generateSlots({
        timeZone: browserTimeZone,
        durationMinutes: duration,
        days: sortedSelectedDays.map((date) => ({
          date,
          blocks: sortBlocks(blocksForDay(date)),
        })),
      });
      setToast({ msg: t('availability.generated', { count: data.length }), type: 'success' });
      setWeekStart(firstGeneratedWeek);
      const range = getWeekRange(firstGeneratedWeek);
      await fetchSlots(range.from, range.to);
      setActiveTab('mySlots');
    } catch {
      setToast({ msg: genError ?? t('availability.errorGeneric'), type: 'error' });
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateSlot(deactivateTarget.id);
      setToast({ msg: t('availability.deactivated'), type: 'success' });
      setDeactivateTarget(null);
      handleFetchSlots();
    } catch {
      setToast({ msg: t('availability.errorGeneric'), type: 'error' });
    }
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
        disabled: !slot.active,
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
          <div className={`max-w-7xl mx-auto mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success'
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
          {(['generate', 'mySlots'] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'generate' ? t('availability.tabGenerate') : t('availability.tabMySlots')}
            </button>
          ))}
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {getWeekDays(weekStart).map((dateKey) => {
                      const selected = selectedDays.includes(dateKey);
                      const disabled = dateKey < todayDateKey();
                      return (
                        <button
                          key={dateKey}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleSelectedDay(dateKey)}
                          className={`rounded-lg border px-3 py-3 text-left text-sm transition-all disabled:cursor-not-allowed ${
                            disabled
                              ? 'border-border bg-muted/60 text-muted-foreground/60'
                              : selected
                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                : 'border-border bg-background hover:border-primary/50'
                          }`}
                        >
                          <span className="block font-semibold">{formatLocalDate(dateKey)}</span>
                        </button>
                      );
                    })}
                  </div>
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
                      onChange={(event) => setDuration(Number(event.target.value))}
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
                      {[...selectedDays].sort().map((dateKey) => {
                        const blocks = blocksForDay(dateKey);
                        return (
                          <section key={dateKey} className="rounded-lg border border-border bg-background p-3 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold">{formatLocalDate(dateKey)}</p>
                              <Button type="button" variant="outline" size="sm" onClick={() => addDayBlock(dateKey)}>
                                <Plus size={14} className="mr-1.5" />
                                {t('availability.addBlock')}
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {blocks.map((block, index) => (
                                <div key={`${dateKey}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                  <Input
                                    type="time"
                                    min={EARLIEST_SLOT_TIME}
                                    max={LATEST_SLOT_TIME}
                                    value={block.startTime}
                                    onChange={(event) => updateDayBlock(dateKey, index, 'startTime', event.target.value)}
                                  />
                                  <Input
                                    type="time"
                                    min={EARLIEST_SLOT_TIME}
                                    max={LATEST_SLOT_TIME}
                                    value={block.endTime}
                                    onChange={(event) => updateDayBlock(dateKey, index, 'endTime', event.target.value)}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeDayBlock(dateKey, index)}
                                    disabled={blocks.length === 1}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </section>
                        );
                      })}
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
                const slot = slots.find((candidate) => candidate.id === item.id);
                if (slot) setDeactivateTarget(slot);
              }}
            />
          </>
        )}
      </main>

      <Dialog open={!!deactivateTarget} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('availability.deactivateTitle')}</DialogTitle>
            <DialogDescription>{t('availability.deactivateConfirm')}</DialogDescription>
          </DialogHeader>
          {deactivateTarget && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{formatLocalDate(deactivateTarget.startTime)}</p>
              <p className="text-muted-foreground">
                {formatLocalTime(deactivateTarget.startTime)} - {formatLocalTime(deactivateTarget.endTime)}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>{t('availability.close')}</Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  {t('availability.deactivating')}
                </>
              ) : (
                t('availability.deactivateBtn')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  getBrowserTimeZone,
  getWeekRange,
  startOfWeek,
  todayDateKey,
} from '@/features/agenda/utils/agendaDateUtils';
import { useGenerateSlots } from './useGenerateSlots';
import { useNutritionistSlots } from './useNutritionistSlots';
import { useDeactivateSlot } from './useDeactivateSlot';
import { useActivateSlot } from './useActivateSlot';
import type { AvailabilitySlotResponse, GenerateSlotsTimeBlock } from '../types/agenda.types';
import {
  validateDuration,
  validateTimeBlock,
  validateNoOverlap,
  validateNotPastToday,
  validateBlockFitsDuration,
} from '@/features/agenda/validators/agendaValidation';

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

export const defaultBlock = (preferFutureToday = false): GenerateSlotsTimeBlock => {
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

export const sortBlocks = (blocks: GenerateSlotsTimeBlock[]) =>
  [...blocks].sort((left, right) => left.startTime.localeCompare(right.startTime));


interface Toast {
  msg: string;
  type: 'success' | 'error';
}

export const useNutritionistAvailabilityPage = () => {
  const { t } = useTranslation('nutritionist');

  const initialSchedule = useMemo(createInitialScheduleState, []);
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);

  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [weekStart, setWeekStart] = useState(startOfWeek(todayDateKey()));
  const [selectedDays, setSelectedDays] = useState<string[]>(initialSchedule.selectedDays);
  const [dayBlocks, setDayBlocks] = useState<DayBlocksByDate>(initialSchedule.dayBlocks);
  const [duration, setDuration] = useState(45);
  const [deactivateTarget, setDeactivateTarget] = useState<AvailabilitySlotResponse | null>(null);
  const [activateTarget, setActivateTarget] = useState<AvailabilitySlotResponse | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const { generateSlots, isLoading: generating, error: genError, isSuccess: genSuccess, slots: generatedSlots } = useGenerateSlots();
  const { slots, isLoading: loadingSlots, error: slotError, fetchSlots } = useNutritionistSlots();
  const { deactivateSlot, isLoading: deactivating } = useDeactivateSlot();
  const { activateSlot, isLoading: activating } = useActivateSlot();

  useEffect(() => {
    if (!toast) return;
    const id = globalThis.setTimeout(() => setToast(null), 4000);
    return () => globalThis.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'mySlots') {
      handleFetchSlots();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const durationError = validateDuration(duration);
    if (durationError) {
      setToast({ msg: t(durationError), type: 'error' });
      return;
    }
    for (const date of selectedDays) {
      const blocks = blocksForDay(date);
      if (blocks.length === 0) {
        setToast({ msg: t('availability.invalidBlocks'), type: 'error' });
        return;
      }
      for (const block of blocks) {
        const blockError = validateTimeBlock(block.startTime, block.endTime);
        if (blockError) {
          setToast({ msg: t(blockError), type: 'error' });
          return;
        }
        const fitsError = validateBlockFitsDuration(block.startTime, block.endTime, duration);
        if (fitsError) {
          setToast({ msg: t(fitsError), type: 'error' });
          return;
        }
      }
      const overlapError = validateNoOverlap(blocks);
      if (overlapError) {
        setToast({ msg: t(overlapError), type: 'error' });
        return;
      }
      const pastError = validateNotPastToday(date, blocks, todayDateKey());
      if (pastError) {
        setToast({ msg: t(pastError), type: 'error' });
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
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setToast({ msg: t('availability.errorDeactivateSlotTooLate'), type: 'error' });
          return;
        }
        if (status === 403) {
          setToast({ msg: t('availability.errorDeactivateSlotForbidden'), type: 'error' });
          return;
        }
        if (status === 404) {
          setToast({ msg: t('availability.errorDeactivateSlotNotFound'), type: 'error' });
          return;
        }
      }
      setToast({ msg: t('availability.errorDeactivateSlotUnexpected'), type: 'error' });
    }
  };

  const handleActivate = async () => {
    if (!activateTarget) return;
    try {
      await activateSlot(activateTarget.id);
      setToast({ msg: t('availability.activated'), type: 'success' });
      setActivateTarget(null);
      handleFetchSlots();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403 || status === 409) {
          setToast({ msg: t('availability.errorActivateSlotForbidden'), type: 'error' });
          return;
        }
        if (status === 404) {
          setToast({ msg: t('availability.errorActivateSlotNotFound'), type: 'error' });
          return;
        }
      }
      setToast({ msg: t('availability.errorActivateSlotUnexpected'), type: 'error' });
    }
  };

  const handleSlotCalendarItemClick = (slot: AvailabilitySlotResponse | undefined) => {
    if (!slot) return;
    if (slot.reserved) {
      setToast({ msg: t('availability.slotReservedManageInAgenda'), type: 'error' });
      return;
    }
    if (slot.active) {
      setDeactivateTarget(slot);
      return;
    }
    setActivateTarget(slot);
  };

  return {
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
  };
};

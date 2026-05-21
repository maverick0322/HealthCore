import { useEffect, useMemo, useState } from 'react';
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
import type { AvailabilitySlotResponse, GenerateSlotsTimeBlock } from '../types/agenda.types';

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
  const [toast, setToast] = useState<Toast | null>(null);

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

  return {
    activeTab,
    setActiveTab,
    weekStart,
    selectedDays,
    duration,
    setDuration,
    deactivateTarget,
    setDeactivateTarget,
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
    handleFetchSlots,
    goToWeek,
    toggleSelectedDay,
    blocksForDay,
    updateDayBlock,
    addDayBlock,
    removeDayBlock,
    handleGenerate,
    handleDeactivate,
    EARLIEST_SLOT_TIME,
    LATEST_SLOT_TIME,
  };
};

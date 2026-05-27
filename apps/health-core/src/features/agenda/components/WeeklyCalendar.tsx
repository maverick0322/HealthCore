import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import {
  formatLocalDate,
  formatLocalTime,
  getWeekDays,
  localDateKeyFromIso,
} from '@/features/agenda/utils/agendaDateUtils';

export type WeeklyCalendarItemKind =
  | 'available'
  | 'selected'
  | 'reserved'
  | 'appointment'
  | 'cancelled'
  | 'inactive';

export interface WeeklyCalendarItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  subtitle?: string;
  kind: WeeklyCalendarItemKind;
  disabled?: boolean;
}

export interface WeeklyCalendarLabels {
  previous: string;
  next: string;
  today: string;
  empty: string;
  loading: string;
}

interface WeeklyCalendarProps {
  title: string;
  weekStart: string;
  items: WeeklyCalendarItem[];
  labels: WeeklyCalendarLabels;
  minHour?: number;
  maxHour?: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onItemClick?: (item: WeeklyCalendarItem) => void;
  isLoading?: boolean;
}


const HOUR_HEIGHT = 80; // px per hour — ensures even 30-min slots (40px space) never overflow their grid cell

const getItemLayout = (item: WeeklyCalendarItem, minHour: number) => {
  const start = new Date(item.startTime);
  const end = new Date(item.endTime);
  const startMinutes = (start.getHours() - minHour) * 60 + start.getMinutes();
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  return {
    top: Math.max(0, (startMinutes / 60) * HOUR_HEIGHT),
    // Subtract 2px visual gap. No min-height clamp — proportional sizing prevents overlap.
    height: Math.max(16, (durationMinutes / 60) * HOUR_HEIGHT - 2),
  };
};
const kindClasses: Record<WeeklyCalendarItemKind, string> = {
  available: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100 hover:border-emerald-500',
  selected: 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20',
  reserved: 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-100 hover:border-amber-500',
  appointment: 'border-sky-500/50 bg-sky-500/10 text-sky-900 dark:text-sky-100 hover:border-sky-500',
  cancelled: 'border-rose-500/45 bg-rose-500/10 text-rose-800 dark:text-rose-100',
  inactive: 'border-border bg-muted/60 text-muted-foreground',
};


export const WeeklyCalendar = ({
  title,
  weekStart,
  items,
  labels,
  minHour = 6,
  maxHour = 21,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onItemClick,
  isLoading = false,
}: WeeklyCalendarProps) => {
  const days = getWeekDays(weekStart);
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, index) => minHour + index);
  const bodyHeight = (maxHour - minHour) * HOUR_HEIGHT;

  const itemsByDay = days.reduce<Record<string, WeeklyCalendarItem[]>>((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});

  items.forEach((item) => {
    const dayKey = localDateKeyFromIso(item.startTime);
    if (itemsByDay[dayKey]) {
      itemsByDay[dayKey].push(item);
    }
  });

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={onPreviousWeek} aria-label={labels.previous}>
            <ChevronLeft size={16} />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday}>
            <RotateCcw size={14} className="mr-1.5" />
            {labels.today}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onNextWeek} aria-label={labels.next}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="relative md:hidden">
        <div className="divide-y divide-border/60">
          {days.map((day) => {
            const dayItems = itemsByDay[day].sort((left, right) => left.startTime.localeCompare(right.startTime));
            return (
              <div key={day} className="p-3">
                <p className="text-sm font-semibold">{formatLocalDate(day)}</p>
                {dayItems.length === 0 ? (
                  <p className="mt-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                    {labels.empty}
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {dayItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={item.disabled || !onItemClick}
                        onClick={() => onItemClick?.(item)}
                        className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-all disabled:cursor-default ${kindClasses[item.kind]}`}
                      >
                        <span className="block font-semibold">{item.title}</span>
                        <span className="block opacity-80">
                          {formatLocalTime(item.startTime)} - {formatLocalTime(item.endTime)}
                        </span>
                        {item.subtitle && <span className="block opacity-75">{item.subtitle}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              {labels.loading}
            </div>
          </div>
        )}
      </div>

      <div className="relative hidden overflow-x-auto md:block">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[64px_repeat(7,minmax(96px,1fr))] border-b border-border/60 bg-muted/30">
            <div />
            {days.map((day) => (
              <div key={day} className="border-l border-border/60 px-2 py-2 text-center">
                <p className="text-xs font-semibold text-foreground">{formatLocalDate(day)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[64px_repeat(7,minmax(96px,1fr))]" style={{ height: bodyHeight }}>
            <div className="relative border-r border-border/60 bg-card">
              {hours.slice(0, -1).map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-2 text-[11px] font-medium text-muted-foreground"
                  style={{ top: (hour - minHour) * HOUR_HEIGHT }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {days.map((day) => (
              <div key={day} className="relative border-l border-border/60 bg-background">
                {hours.slice(0, -1).map((hour) => (
                  <div
                    key={`${day}-${hour}`}
                    className="absolute inset-x-0 border-t border-border/50"
                    style={{ top: (hour - minHour) * HOUR_HEIGHT }}
                  />
                ))}

                {itemsByDay[day]
                  .sort((left, right) => left.startTime.localeCompare(right.startTime))
                  .map((item) => {
                    const layout = getItemLayout(item, minHour);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={item.disabled || !onItemClick}
                        onClick={() => onItemClick?.(item)}
                        className={`absolute left-1 right-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs transition-all disabled:cursor-default ${kindClasses[item.kind]}`}
                        style={{ top: layout.top, height: layout.height }}
                      >
                        <span className="block truncate font-semibold">{item.title}</span>
                        <span className="block truncate opacity-80">
                          {formatLocalTime(item.startTime)} - {formatLocalTime(item.endTime)}
                        </span>
                        {item.subtitle && <span className="block truncate opacity-75">{item.subtitle}</span>}
                      </button>
                    );
                  })}
              </div>
            ))}

          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              {labels.loading}
            </div>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="absolute inset-x-0 top-24 flex justify-center pointer-events-none">
            <div className="rounded-lg border border-dashed border-border bg-card/90 px-4 py-3 text-sm text-muted-foreground shadow-sm">
              {labels.empty}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
export default WeeklyCalendar;
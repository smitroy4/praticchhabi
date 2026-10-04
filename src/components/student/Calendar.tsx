'use client';

import { useState, useMemo } from 'react';
import { cn, getDayName, formatDateShort, isToday } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ClassSession } from '@/types';
import { ScheduleTimeline } from './ScheduleTimeline';

interface CalendarProps {
  classes: ClassSession[];
  mode?: 'month' | 'week' | 'day';
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}

export function Calendar({ classes, mode = 'month', onDateSelect, selectedDate, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState(mode);
  const [selectedDay, setSelectedDay] = useState<Date | null>(selectedDate || null);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days: (Date | null)[] = [];
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentMonth]);

  const classesByDate = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    classes.forEach(cls => {
      const key = cls.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(cls);
    });
    return map;
  }, [classes]);

  const getClassesForDate = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return classesByDate.get(key) || [];
  };

  const handleDayClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDay(date);
    onDateSelect?.(date);
  };

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDay(today);
    onDateSelect?.(today);
  };

  if (viewMode === 'month') {
    return (
      <Card variant="default" padding="md" className={className}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToToday} aria-label="Go to today">
              <CalendarIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2" role="row" aria-label="Days of week">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2" role="columnheader">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1" role="grid">
          {daysInMonth.map((date, index) => {
            if (!date) return <div key={index} className="aspect-square" />;
            
            const dayClasses = getClassesForDate(date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isSelected = selectedDay && date.toDateString() === selectedDay.toDateString();
            const isTodayDate = isToday(date);
            const hasClasses = dayClasses.length > 0;

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                className={cn(
                  'relative aspect-square rounded-lg flex flex-col items-center justify-start p-1.5 transition-smooth pressable',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isTodayDate && 'bg-primary-light text-primary font-medium',
                  isSelected && 'ring-2 ring-primary ring-offset-2',
                  hasClasses && 'bg-muted'
                )}
                aria-pressed={isSelected || undefined}
                aria-current={isTodayDate ? 'date' : undefined}
                aria-label={`${getDayName(date)}, ${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })}. ${hasClasses ? `${dayClasses.length} class${dayClasses.length > 1 ? 'es' : ''}` : 'No classes'}`}
              >
                <span className="text-sm">{date.getDate()}</span>
                {hasClasses && (
                  <div className="flex gap-0.5 mt-1">
                    {dayClasses.slice(0, 2).map(cls => (
                      <span
                        key={cls.id}
                        className={cn('h-1.5 w-1.5 rounded-full', cls.type === 'online' ? 'bg-secondary' : 'bg-primary')}
                      />
                    ))}
                    {dayClasses.length > 2 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">
                {isToday(selectedDay) ? 'Today' : getDayName(selectedDay)}, {formatDateShort(selectedDay)}
              </h4>
              {getClassesForDate(selectedDay).length > 0 && (
                <Badge variant="outline" size="sm">{getClassesForDate(selectedDay).length} class{getClassesForDate(selectedDay).length > 1 ? 'es' : ''}</Badge>
              )}
            </div>
            <ScheduleTimeline classes={getClassesForDate(selectedDay)} mode="today" showEmpty emptyMessage="No classes on this day." />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Calendar</h3>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {['month', 'week', 'day'].map(m => (
            <Button
              key={m}
              variant={viewMode === m ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(m as 'month' | 'week' | 'day')}
              className="rounded-md px-3"
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center py-8">Week and Day views coming soon</p>
    </Card>
  );
}
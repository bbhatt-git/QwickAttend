
"use client";

import * as React from "react";
import NepaliDate from "nepali-date-converter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export interface DateRange {
  from: NepaliDate;
  to: NepaliDate;
}

interface NepaliCalendarProps {
  mode?: "single" | "range";
  value?: NepaliDate | DateRange;
  onSelect?: (date: NepaliDate | DateRange | undefined) => void;
}

export function NepaliCalendar({ mode = "single", value, onSelect }: NepaliCalendarProps) {
  const [viewDate, setViewDate] = React.useState(
    (mode === "single" ? value as NepaliDate : (value as DateRange)?.from) || new NepaliDate()
  );
  const [hoveredDate, setHoveredDate] = React.useState<NepaliDate | null>(null);

  const today = new NepaliDate();

  const handlePrevMonth = () => {
    setViewDate(prev => {
      const year = prev.getMonth() === 0 ? prev.getYear() - 1 : prev.getYear();
      const month = prev.getMonth() === 0 ? 11 : prev.getMonth() - 1;
      return new NepaliDate(year, month, 1);
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const year = prev.getMonth() === 11 ? prev.getYear() + 1 : prev.getYear();
      const month = prev.getMonth() === 11 ? 0 : prev.getMonth() + 1;
      return new NepaliDate(year, month, 1);
    });
  };

  const handleDayClick = (day: NepaliDate) => {
    if (mode === "single") {
      onSelect?.(day);
    } else { // range mode
      const range = value as DateRange;
      if (!range?.from || range.to) {
        onSelect?.({ from: day, to: day });
      } else {
        if (day < range.from) {
            onSelect?.({ from: day, to: range.from });
        } else {
            onSelect?.({ from: range.from, to: day });
        }
      }
    }
  };

  const isDateInRange = (date: NepaliDate, range?: DateRange) => {
    if (!range?.from || !range.to) return false;
    return date >= range.from && date <= range.to;
  };
  
  const isDateHovered = (date: NepaliDate, range?: DateRange) => {
    if (mode !== 'range' || !range?.from || range.to || !hoveredDate) return false;
    const start = range.from < hoveredDate ? range.from : hoveredDate;
    const end = range.from > hoveredDate ? range.from : hoveredDate;
    return date > start && date < end;
  }

  const renderDays = () => {
    const year = viewDate.getYear();
    const month = viewDate.getMonth();
    
    const firstDayOfMonth = new NepaliDate(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new NepaliDate(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-start-${i}`} className="h-9 w-9" />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new NepaliDate(year, month, i);
      const isToday = today.isSame(currentDate, 'day');
      const isDisabled = currentDate.toJsDate() > new Date() && !isToday;

      let isSelected = false;
      let isRangeStart = false;
      let isRangeEnd = false;
      let isInRange = false;
      let isInHoverRange = false;

      if (mode === 'single' && value) {
        isSelected = (value as NepaliDate).isSame(currentDate, 'day');
      } else if (mode === 'range' && value) {
        const range = value as DateRange;
        isRangeStart = range.from?.isSame(currentDate, 'day');
        isRangeEnd = range.to?.isSame(currentDate, 'day');
        isSelected = isRangeStart || isRangeEnd;
        isInRange = isDateInRange(currentDate, range);
        isInHoverRange = isDateHovered(currentDate, range);
      }
      
      days.push(
        <button
          key={i}
          disabled={isDisabled}
          onClick={() => handleDayClick(currentDate)}
          onMouseEnter={() => mode === 'range' && setHoveredDate(currentDate)}
          onMouseLeave={() => mode === 'range' && setHoveredDate(null)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal",
            isToday && "bg-accent text-accent-foreground",
            isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed",
            !isSelected && !isToday && !isDisabled && "hover:bg-accent hover:text-accent-foreground",
            isInRange && "bg-primary/20 text-primary-foreground rounded-none",
            isInHoverRange && !isInRange && "bg-primary/10 rounded-none",
            isRangeStart && "bg-primary text-primary-foreground rounded-l-full rounded-r-none hover:bg-primary hover:text-primary-foreground",
            isRangeEnd && "bg-primary text-primary-foreground rounded-r-full rounded-l-none hover:bg-primary hover:text-primary-foreground",
            isRangeStart && isRangeEnd && "rounded-full",
            isSelected && mode === 'single' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-3">
      <div className="flex justify-center pt-1 relative items-center">
        <span className="text-sm font-medium">
          {viewDate.format("MMMM YYYY")}
        </span>
        <div className="space-x-1 flex items-center absolute right-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 mt-4">
        {weekDays.map(day => (
          <div key={day} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 mt-2">
        {renderDays()}
      </div>
    </div>
  );
}

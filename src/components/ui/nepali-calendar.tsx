
"use client";

import * as React from "react";
import NepaliDate from "nepali-date-converter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

interface NepaliCalendarProps {
  value?: NepaliDate;
  onSelect?: (date: NepaliDate) => void;
}

export function NepaliCalendar({ value, onSelect }: NepaliCalendarProps) {
  const [viewDate, setViewDate] = React.useState(value || new NepaliDate());

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

  const renderDays = () => {
    const year = viewDate.getYear();
    const month = viewDate.getMonth();
    const monthData = new NepaliDate(year, month, 1).getMonthData();

    const days = [];
    // Add empty cells for the first day's offset
    for (let i = 0; i < monthData.startDayOfWeek; i++) {
      days.push(<div key={`empty-start-${i}`} className="h-9 w-9" />);
    }

    for (let i = 1; i <= monthData.daysInMonth; i++) {
      const currentDate = new NepaliDate(year, month, i);
      const isSelected = value && value.getYear() === year && value.getMonth() === month && value.getDate() === i;
      const isToday = today.getYear() === year && today.getMonth() === month && today.getDate() === i;
      const isDisabled = currentDate.toJsDate() > new Date();

      days.push(
        <button
          key={i}
          disabled={isDisabled}
          onClick={() => onSelect?.(currentDate)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            isToday && "bg-accent text-accent-foreground",
            isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed",
            !isSelected && !isToday && !isDisabled && "hover:bg-accent hover:text-accent-foreground"
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

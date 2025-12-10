
"use client";

import * as React from "react";
import NepaliDate from "nepali-date-converter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export interface DateRange {
  from?: NepaliDate;
  to?: NepaliDate;
}

const isSameDate = (date1?: NepaliDate, date2?: NepaliDate, unit: 'day' | 'month' | 'year' = 'day'): boolean => {
    if (!date1 || !date2) return false;
    if (unit === 'day') {
      return date1.getYear() === date2.getYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    }
    if (unit === 'month') {
      return date1.getYear() === date2.getYear() &&
             date1.getMonth() === date2.getMonth();
    }
    if (unit === 'year') {
      return date1.getYear() === date2.getYear();
    }
    return false;
};

const MonthView = ({ 
    viewDate, 
    value, 
    onDayClick, 
    hoveredDate,
    setHoveredDate,
    mode 
}: { 
    viewDate: NepaliDate, 
    value?: NepaliDate | DateRange, 
    onDayClick: (date: NepaliDate) => void,
    hoveredDate: NepaliDate | null,
    setHoveredDate: (date: NepaliDate | null) => void,
    mode: "single" | "range"
}) => {
    const today = new NepaliDate();
    const year = viewDate.getYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new NepaliDate(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new NepaliDate(year, month + 1, 0).getDate();

    const isDateInRange = (date: NepaliDate, range?: DateRange) => {
        if (!range?.from) return false;
        const to = range.to || range.from;
        const start = range.from < to ? range.from : to;
        const end = range.from > to ? range.from : to;
        return date >= start && date <= end;
    };
    
    const isDateHovered = (date: NepaliDate, range?: DateRange) => {
        if (mode !== 'range' || !range?.from || range.to || !hoveredDate) return false;
        const start = range.from < hoveredDate ? range.from : hoveredDate;
        const end = range.from > hoveredDate ? range.from : hoveredDate;
        return date > start && date < end;
    }

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(<div key={`empty-start-${i}`} className="h-9 w-9" />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new NepaliDate(year, month, i);
        const isToday = isSameDate(today, currentDate, 'day');
        
        let isSelected = false;
        let isRangeStart = false;
        let isRangeEnd = false;
        let isInRange = false;
        let isInHoverRange = false;

        if (mode === 'single' && value && value instanceof NepaliDate) {
            isSelected = isSameDate(value, currentDate, 'day');
        } else if (mode === 'range' && value) {
            const range = value as DateRange;
            isRangeStart = !!range.from && isSameDate(range.from, currentDate, 'day');
            isRangeEnd = !!range.to && isSameDate(range.to, currentDate, 'day');
            isSelected = isRangeStart || isRangeEnd;
            isInRange = isDateInRange(currentDate, range);
            isInHoverRange = isDateHovered(currentDate, range);
        }

        days.push(
            <button
              key={i}
              onClick={() => onDayClick(currentDate)}
              onMouseEnter={() => mode === 'range' && setHoveredDate(currentDate)}
              onMouseLeave={() => mode === 'range' && setHoveredDate(null)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-9 p-0 font-normal",
                isToday && "bg-accent text-accent-foreground",
                !isSelected && !isToday && "hover:bg-accent hover:text-accent-foreground",
                
                // Range-specific styles
                mode === 'range' && isInRange && "bg-accent text-accent-foreground rounded-none",
                mode === 'range' && isInHoverRange && !isInRange && "bg-accent/50 rounded-none",

                (mode === 'range' && isRangeStart) && "bg-primary text-primary-foreground rounded-l-md rounded-r-none hover:bg-primary hover:text-primary-foreground",
                (mode === 'range' && isRangeEnd) && "bg-primary text-primary-foreground rounded-r-md rounded-l-none hover:bg-primary hover:text-primary-foreground",
                (mode === 'range' && isRangeStart && isRangeEnd) && "rounded-md",
                
                // Single-specific styles
                mode === 'single' && isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
              )}
            >
              {i}
            </button>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-center text-sm font-medium">
                {viewDate.format("MMMM YYYY")}
            </div>
            <div className="grid grid-cols-7">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={`${day}-${i}`} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {days}
            </div>
        </div>
    );
};

type NepaliCalendarProps = {
  mode?: "single" | "range";
  value?: NepaliDate | DateRange;
  onSelect?: (date?: NepaliDate | DateRange) => void;
  numberOfMonths?: number;
};


export function NepaliCalendar({ mode = "single", value, onSelect, ...props }: NepaliCalendarProps) {
  const numberOfMonths = 1;
  
  const [viewDate, setViewDate] = React.useState(
    (mode === "single" ? value as NepaliDate : (value as DateRange)?.from) || new NepaliDate()
  );
  const [hoveredDate, setHoveredDate] = React.useState<NepaliDate | null>(null);

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
    if (onSelect) {
        if (mode === "single") {
            onSelect(day);
        } else { // range mode
            const range = value as DateRange;
            if (!range?.from || range.to) {
                onSelect({ from: day, to: undefined });
            } else {
                if (day < range.from) {
                    onSelect({ from: day, to: range.from });
                } else {
                    onSelect({ from: range.from, to: day });
                }
            }
        }
    }
  };
  
  const getNextMonthDate = (date: NepaliDate) => {
    const year = date.getMonth() === 11 ? date.getYear() + 1 : date.getYear();
    const month = date.getMonth() === 11 ? 0 : date.getMonth() + 1;
    return new NepaliDate(year, month, 1);
  }

  return (
    <div className={cn("p-3 relative")}>
      <div className="absolute top-3 left-3 flex items-center">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
          </Button>
      </div>
      <div className="absolute top-3 right-3 flex items-center">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
          </Button>
      </div>
     
      <div className={cn("flex flex-col")}>
        <MonthView 
            viewDate={viewDate}
            value={value}
            onDayClick={handleDayClick}
            hoveredDate={hoveredDate}
            setHoveredDate={setHoveredDate}
            mode={mode}
        />
      </div>
    </div>
  );
}

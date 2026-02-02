"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Select time"
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempHour, setTempHour] = React.useState("12");
  const [tempMinute, setTempMinute] = React.useState("00");
  const [tempPeriod, setTempPeriod] = React.useState<"AM" | "PM">("AM");

  // Initialize from value
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      
      hours = hours % 12 || 12;
      
      setTempHour(hours.toString().padStart(2, '0'));
      setTempMinute(minutes.toString().padStart(2, '0'));
      setTempPeriod(period);
    }
  }, [value]);

  const handleConfirm = () => {
    let hour = parseInt(tempHour);
    
    // Convert to 24-hour format
    if (tempPeriod === "PM" && hour !== 12) {
      hour += 12;
    } else if (tempPeriod === "AM" && hour === 12) {
      hour = 0;
    }
    
    // Create time string in format "HH:MM"
    const timeString = `${hour.toString().padStart(2, '0')}:${tempMinute}`;
    
    // If we have an existing value, update just the time
    if (value) {
      const date = new Date(value);
      const [h, m] = timeString.split(':');
      date.setHours(parseInt(h), parseInt(m), 0, 0);
      onChange(date.toISOString());
    } else {
      // Create new date with today's date and selected time
      const date = new Date();
      const [h, m] = timeString.split(':');
      date.setHours(parseInt(h), parseInt(m), 0, 0);
      onChange(date.toISOString());
    }
    
    setOpen(false);
  };

  const handleCancel = () => {
    // Reset to current value
    if (value) {
      const date = new Date(value);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      
      hours = hours % 12 || 12;
      
      setTempHour(hours.toString().padStart(2, '0'));
      setTempMinute(minutes.toString().padStart(2, '0'));
      setTempPeriod(period);
    }
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : placeholder;

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            {/* Hour Selector */}
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block text-foreground">Hour</label>
              <select
                value={tempHour}
                onChange={(e) => setTempHour(e.target.value)}
                className="w-full border border-input bg-background text-foreground rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {hours.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Minute Selector */}
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block text-foreground">Minute</label>
              <select
                value={tempMinute}
                onChange={(e) => setTempMinute(e.target.value)}
                className="w-full border border-input bg-background text-foreground rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {minutes.filter((_, i) => i % 5 === 0).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* AM/PM Toggle */}
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block text-foreground">Period</label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={tempPeriod === "AM" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTempPeriod("AM")}
                >
                  AM
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={tempPeriod === "PM" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTempPeriod("PM")}
                >
                  PM
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
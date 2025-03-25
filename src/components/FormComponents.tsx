
import React, { forwardRef } from 'react';
import { CalendarIcon, ChevronDownIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const UnderlineInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ className, label, ...props }, ref) => {
  return (
    <div className="mb-4 w-full">
      {label && <label className="text-sm text-muted-foreground mb-1 block">{label}</label>}
      <input
        className={cn(
          "input-underline",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
UnderlineInput.displayName = "UnderlineInput";

export const DatePickerInput = forwardRef<
  HTMLButtonElement,
  {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    label?: string;
  }
>(({ value, onChange, placeholder = "Select date", className, label }, ref) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className="mb-4 w-full">
      {label && <label className="text-sm text-muted-foreground mb-1 block">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-transparent border-b border-white/30 hover:border-white/70 rounded-none px-1 py-2 h-auto",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "MMMM d, yyyy") : <span>{placeholder}</span>}
            {value && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto h-6 w-6 p-0 hover:bg-white/10" 
                onClick={handleClear}
                aria-label="Clear date"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-black border border-white/20 shadow-xl rounded-md" 
          align="start"
          sideOffset={5}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className="p-3 pointer-events-auto bg-black text-white"
            disabled={(date) => date > new Date()}
            modifiersClassNames={{
              selected: "bg-period text-white rounded-full",
              today: "bg-accent/50 text-white rounded-full border border-white/30"
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
});
DatePickerInput.displayName = "DatePickerInput";

export const SelectInput = forwardRef<
  HTMLButtonElement,
  {
    value?: string;
    onChange: (value: string) => void;
    options: { label: string, value: string }[];
    placeholder?: string;
    className?: string;
    label?: string;
  }
>(({ value, onChange, options, placeholder = "Select option", className, label }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="mb-4 w-full">
      {label && <label className="text-sm text-muted-foreground mb-1 block">{label}</label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between text-left font-normal bg-transparent border-b border-white/30 hover:border-white/70 rounded-none px-1 py-2 h-auto",
              !value && "text-muted-foreground",
              className
            )}
          >
            {value ? options.find(option => option.value === value)?.label || placeholder : placeholder}
            <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-black border border-white/20">
          <div className="max-h-[200px] overflow-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-muted",
                  value === option.value && "bg-muted"
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
SelectInput.displayName = "SelectInput";

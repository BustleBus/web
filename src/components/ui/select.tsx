import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils"; // Assuming cn utility exists

// Context to share state between Select components
type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("useSelectContext must be used within a SelectProvider");
  }
  return context;
};

const Select = ({ children, onValueChange, value }: { children: React.ReactNode, onValueChange?: (value: string) => void, value?: string }) => {
  const [open, setOpen] = useState(false);

  const handleValueChange = useCallback((newValue: string) => {
    onValueChange?.(newValue);
    setOpen(false); // Close on selection
  }, [onValueChange]);

  return (
    <SelectContext.Provider value={{ value: value || "", onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { setOpen } = useSelectContext();
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setOpen(prev => !prev)}
      {...props}
    >
      {children}
      {/* You might want an icon here, like a chevron down */}
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useSelectContext();
  return <span className="block truncate">{value || placeholder}</span>;
};

const SelectContent = ({ children, className, ...props }: { children: React.ReactNode, className?: string }) => {
  const { open } = useSelectContext();
  if (!open) return null; // Only render when open

  return (
    <div
      className={cn(
        "absolute z-20 min-w-[8rem] overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md animate-in fade-in-80 max-h-60 overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const SelectItem = ({ children, value, className, ...props }: { children: React.ReactNode, value: string, className?: string }) => {
  const { onValueChange, value: selectedValue } = useSelectContext();
  const isSelected = selectedValue === value;
  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectContent, SelectValue, SelectItem };

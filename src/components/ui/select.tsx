import React from "react";

const Select = ({ children, onValueChange, value }: { children: React.ReactNode, onValueChange?: (value: string) => void, value?: string }) => (
    <div className="relative">
        <select onChange={e => onValueChange?.(e.target.value)} value={value} className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            {children}
        </select>
    </div>
);

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <button ref={ref} {...props} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
      {children}
  </button>
));
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;

const SelectContent = ({ children, className, ...props }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 ${className}`} {...props}>{children}</div>
);

const SelectItem = ({ children, value, ...props }: { children: React.ReactNode, value: string }) => (
  <option value={value} {...props} className="text-sm">{children}</option>
);

export { Select, SelectTrigger, SelectContent, SelectValue, SelectItem };

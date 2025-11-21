"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Search, Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

interface VirtualizedComboboxProps {
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  noResultsMessage?: string
  value?: string
  onSelect?: (value: string | null) => void
}

export function VirtualizedCombobox({
  options,
  placeholder,
  searchPlaceholder,
  noResultsMessage,
  value,
  onSelect,
}: VirtualizedComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const allOption: ComboboxOption = React.useMemo(() => ({ value: "__ALL__", label: "모두 보기" }), []);

  const filteredOptions = React.useMemo(() => {
    const baseOptions = search
      ? options.filter((option) =>
          option.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;
    return [allOption, ...baseOptions];
  }, [options, search, allOption]);

  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 5,
  })

  // Force virtualizer to remeasure when options change
  React.useEffect(() => {
    virtualizer.measure()
  }, [filteredOptions, virtualizer])

  const handleSelect = (currentValue: string | null) => {
    if (onSelect) {
      if (currentValue === allOption.value) {
        onSelect(null);
      } else {
        onSelect(currentValue === value ? null : currentValue);
      }
    }
    setOpen(false);
  };

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedOption ? selectedOption.label : placeholder || "Select an option"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        style={{ minWidth: "var(--radix-popover-trigger-width)" }}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || "Search..."}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div ref={parentRef} className="max-h-[300px] overflow-y-auto">
          {filteredOptions.length <= 1 ? ( // Only "모두 보기"
            <p className="py-6 text-center text-sm">{noResultsMessage || "No results found."}</p>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const option = filteredOptions[virtualItem.index]
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value && option.value !== allOption.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

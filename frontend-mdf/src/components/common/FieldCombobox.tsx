import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

type FieldOption = {
  key: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  options: FieldOption[];
};

export function FieldCombobox({ value, onChange, options }: Props) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.key === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* TRIGGER */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between text-sm"
        >
          {selected?.label || "Select field"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* DROPDOWN (FLOATING - NOT IN LAYOUT) */}
      <PopoverContent className="w-[250px] p-0 z-50">
        <Command>
          <CommandInput placeholder="Search field..." />

          <CommandList>
            <CommandEmpty>No field found</CommandEmpty>

            {options.map((opt) => (
              <CommandItem
                key={opt.key}
                value={opt.label}
                onSelect={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === opt.key ? "opacity-100" : "opacity-0",
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

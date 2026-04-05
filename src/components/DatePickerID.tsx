"use client";

import { useMemo, useRef } from "react";
import { Calendar } from "lucide-react";

interface DatePickerIDProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export default function DatePickerID({ value, onChange, className = "", placeholder = "dd/mm/yyyy" }: DatePickerIDProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const display = useMemo(() => {
    if (!value) return "";
    const p = value.split("-");
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    if (p.length === 2) return `${p[1]}/${p[0]}`;
    return value;
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={() => inputRef.current?.showPicker?.()}
        className="flex items-center gap-2 w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm cursor-pointer select-none"
      >
        <Calendar className="w-4 h-4 text-navy-400 shrink-0" />
        {display ? (
          <span className="text-white">{display}</span>
        ) : (
          <span className="text-navy-500">{placeholder}</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        tabIndex={-1}
      />
    </div>
  );
}

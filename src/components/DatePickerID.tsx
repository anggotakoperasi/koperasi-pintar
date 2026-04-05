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

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.click(); }
  };

  return (
    <div className={`relative cursor-pointer ${className}`} onClick={openPicker}>
      <div className="flex items-center justify-between w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm pointer-events-none select-none">
        <span className={display ? "text-white" : "text-navy-500"}>
          {display || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-navy-400 shrink-0 ml-2" />
      </div>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

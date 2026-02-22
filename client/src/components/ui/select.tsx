"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  disabled,
  label,
  id,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={ref}
      className={[styles.wrapper, className].filter(Boolean).join(" ")}
      id={id}
    >
      {label && <label className={styles.label}>{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[styles.trigger, open ? styles.triggerOpen : ""]
          .filter(Boolean)
          .join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={[
            styles.valueContainer,
            !selected ? styles.placeholder : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {selected?.icon && (
            <span className={styles.iconWrapper}>{selected.icon}</span>
          )}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={[styles.chevron, open ? styles.chevronOpen : ""]
            .filter(Boolean)
            .join(" ")}
        />
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownList}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={[
                    styles.option,
                    isSelected ? styles.optionSelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {option.icon && (
                    <span className={styles.optionIcon}>{option.icon}</span>
                  )}
                  <div className={styles.optionTextContainer}>
                    <p className={styles.optionLabel}>{option.label}</p>
                    {option.description && (
                      <p className={styles.optionDescription}>
                        {option.description}
                      </p>
                    )}
                  </div>
                  {isSelected && <Check className={styles.checkIcon} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

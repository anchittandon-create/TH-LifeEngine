"use client";

import styles from "./Segmented.module.css";

type Option = {
  value: string;
  label: string;
};

type SegmentedProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  ariaLabel?: string;
};

export default function Segmented({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel ?? "Segmented navigation"}
      className={styles.segmented}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active ? "true" : "false"}
            className={`${styles.option} ${active ? styles.active : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

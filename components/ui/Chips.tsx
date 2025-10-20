"use client";

import styles from "./Chips.module.css";

interface ChipProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export function Chip({ label, onRemove, className = "" }: ChipProps) {
  return (
    <span className={`${styles.chip} ${className}`}>
      <span className={styles.chipLabel}>{label}</span>
      {onRemove && (
        <button
          type="button"
          className={styles.chipRemove}
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

interface ChipsProps {
  items: string[];
  onRemove?: (item: string) => void;
  className?: string;
}

export function Chips({ items, onRemove, className = "" }: ChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className={`${styles.chips} ${className}`}>
      {items.map((item) => (
        <Chip
          key={item}
          label={item}
          onRemove={onRemove ? () => onRemove(item) : undefined}
        />
      ))}
    </div>
  );
}
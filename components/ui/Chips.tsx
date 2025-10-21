"use client";

import styles from './Chips.module.css';

interface ChipsProps {
  values: string[];
  onRemove: (value: string) => void;
}

export default function Chips({ values, onRemove }: ChipsProps) {
  return (
    <div className={styles.chips}>
      {values.map((value) => (
        <span className={styles.chip} key={value}>
          <span className={styles.chipLabel}>{value}</span>
          <button
            className={styles.chipRemove}
            aria-label={`Remove ${value}`}
            onClick={() => onRemove(value)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
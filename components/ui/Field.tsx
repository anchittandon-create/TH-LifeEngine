"use client";

import { forwardRef, ReactNode } from "react";
import styles from "./Field.module.css";

interface FieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
  className?: string;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ label, error, helperText, children, className = "" }, ref) => {
    return (
      <div ref={ref} className={`${styles.field} ${className}`}>
        {label && (
          <label className={styles.fieldLabel}>
            {label}
          </label>
        )}
        <div className={styles.fieldInputWrapper}>
          {children}
        </div>
        {error && <div className={styles.fieldError}>{error}</div>}
        {helperText && !error && <div className={styles.fieldHelper}>{helperText}</div>}
      </div>
    );
  }
);

Field.displayName = "Field";
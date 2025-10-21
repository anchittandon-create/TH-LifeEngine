"use client";

import { ReactNode } from 'react';
import styles from './Form.module.css';

interface FieldProps {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, required, helper, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className="cta-pill">Required</span>}
      </label>
      {children}
      {helper && <span className={styles.help}>{helper}</span>}
      {error && <span className={`${styles.help} error`}>{error}</span>}
    </div>
  );
}
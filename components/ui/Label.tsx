'use client';

import { ReactNode } from 'react';
import styles from './Label.module.css';

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  required?: boolean;
}

export function Label({ children, htmlFor, className = '', required }: LabelProps) {
  const classes = [
    styles.label,
    required && styles.required,
    className
  ].filter(Boolean).join(' ');

  return (
    <label htmlFor={htmlFor} className={classes}>
      {children}
    </label>
  );
}
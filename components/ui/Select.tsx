'use client';

import { forwardRef, ReactNode } from 'react';
import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  className?: string;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = '', error, ...props }, ref) => {
    const classes = [
      styles.select,
      error && styles['is-error'],
      className
    ].filter(Boolean).join(' ');

    return (
      <select
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
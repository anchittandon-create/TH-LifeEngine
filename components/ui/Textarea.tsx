'use client';

import { forwardRef } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    const classes = [
      styles.textarea,
      error && styles['is-error'],
      className
    ].filter(Boolean).join(' ');

    return (
      <textarea
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
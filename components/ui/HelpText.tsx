'use client';

import { ReactNode } from 'react';
import styles from './HelpText.module.css';

interface HelpTextProps {
  children: ReactNode;
  className?: string;
  error?: boolean;
}

export function HelpText({ children, className = '', error }: HelpTextProps) {
  const classes = [
    styles.helpText,
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  return <p className={classes}>{children}</p>;
}
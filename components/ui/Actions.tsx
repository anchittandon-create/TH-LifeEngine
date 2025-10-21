'use client';

import { ReactNode } from 'react';
import styles from './Actions.module.css';

interface ActionsProps {
  children: ReactNode;
  className?: string;
}

export function Actions({ children, className = '' }: ActionsProps) {
  const classes = [styles.actions, className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
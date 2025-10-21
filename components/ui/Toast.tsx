'use client';

import { ReactNode, useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const classes = [
    styles.toast,
    styles[type]
  ].join(' ');

  return (
    <div className={classes} role="alert">
      <span className={styles.message}>{message}</span>
      <button
        className={styles.close}
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

interface ToastContainerProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({ children, position = 'top-right' }: ToastContainerProps) {
  const classes = [styles.container, styles[position]].join(' ');
  return <div className={classes}>{children}</div>;
}
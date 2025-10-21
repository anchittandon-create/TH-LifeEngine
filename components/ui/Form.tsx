'use client';

import { FormEvent, ReactNode, useState } from 'react';
import styles from './Form.module.css';

interface FormProps {
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
  submittingLabel?: string;
}

export default function Form({
  onSubmit,
  children,
  className = '',
  submitLabel = 'Submit',
  submittingLabel = 'Submitting...'
}: FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData as any);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const classes = [styles.form, className].filter(Boolean).join(' ');

  return (
    <form onSubmit={handleSubmit} className={classes}>
      {children}
      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submit}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}

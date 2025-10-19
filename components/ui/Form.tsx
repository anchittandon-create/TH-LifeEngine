'use client';

import { FormEvent, ReactNode, useState } from 'react';

interface FormProps {
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

export default function Form({ onSubmit, children, className = '' }: FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {children}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}

export { default as Form } from './Form';
export { Field } from './Field';
export { Label } from './Label';
export { Input } from './Input';
export { Select } from './Select';
export { Textarea } from './Textarea';
export { HelpText } from './HelpText';
export { Actions } from './Actions';
export { Button } from './Button';

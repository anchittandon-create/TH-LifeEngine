'use client';

import { ReactNode } from 'react';

interface FieldProps {
  children: ReactNode;
  className?: string;
}

export function Field({ children, className = '' }: FieldProps) {
  return <div className={`space-y-1 ${className}`}>{children}</div>;
}
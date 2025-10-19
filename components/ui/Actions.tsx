'use client';

import { ReactNode } from 'react';

interface ActionsProps {
  children: ReactNode;
  className?: string;
}

export function Actions({ children, className = '' }: ActionsProps) {
  return <div className={`flex justify-end space-x-2 ${className}`}>{children}</div>;
}
'use client';

import { ReactNode } from 'react';

interface HelpTextProps {
  children: ReactNode;
  className?: string;
}

export function HelpText({ children, className = '' }: HelpTextProps) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
}
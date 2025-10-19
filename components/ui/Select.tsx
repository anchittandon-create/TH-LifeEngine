'use client';

import { forwardRef, ReactNode } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
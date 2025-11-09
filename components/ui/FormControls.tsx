import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
              ${icon ? "pl-12" : ""}
              ${error 
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200" 
                : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
              }
              focus:ring-4 focus:outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
              placeholder:text-gray-400
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, icon, helperText, className = "", children, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl z-10">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none
              ${icon ? "pl-12" : ""}
              ${error 
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200" 
                : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
              }
              focus:ring-4 focus:outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
            ${error 
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200" 
              : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
            }
            focus:ring-4 focus:outline-none
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
            placeholder:text-gray-400
            resize-vertical
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 font-medium flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, className = "", ...props }: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        className={`
          w-5 h-5 mt-0.5 rounded-lg border-2 border-gray-300 
          text-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none
          transition-all duration-200
          checked:border-blue-500 checked:bg-blue-500
          hover:border-blue-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Radio({ label, description, className = "", ...props }: RadioProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="radio"
        className={`
          w-5 h-5 mt-0.5 border-2 border-gray-300 
          text-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none
          transition-all duration-200
          checked:border-blue-500
          hover:border-blue-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

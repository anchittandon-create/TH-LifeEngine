'use client';

type Option = {
  value: string;
  label: string;
};

type SegmentedProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  ariaLabel?: string;
};

export default function Segmented({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel ?? "Segmented navigation"}
      className="flex rounded-md bg-[var(--border)] p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active ? 'true' : 'false'}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              active
                ? 'bg-[var(--card)] text-[var(--fg)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--fg)]'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

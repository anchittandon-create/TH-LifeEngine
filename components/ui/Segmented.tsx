"use client";
type Opt = { value: string; label: string };
type Props = { value: string; onChange: (v: string) => void; options: Opt[]; ariaLabel?: string };
export default function Segmented({ value, onChange, options, ariaLabel }: Props) {
  return (
    <div role="tablist" aria-label={ariaLabel || "View"} className="inline-flex rounded-xl border bg-white p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            data-active={active ? "true" : "false"}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 data-[active=true]:bg-gray-900 data-[active=true]:text-white"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  placeholder?: string;
  options: readonly string[];
};

export function Select({
  label,
  error,
  placeholder,
  options,
  id,
  name,
  className = "",
  ...props
}: Props) {
  const selectId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-small text-foreground">
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={`border-hairline bg-surface text-body text-foreground min-h-12 rounded-base border px-3 outline-none focus-visible:border-sunset focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sunset ${
          error ? "border-danger" : ""
        } ${className}`}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error ? <p className="text-caption text-danger">{error}</p> : null}
    </div>
  );
}

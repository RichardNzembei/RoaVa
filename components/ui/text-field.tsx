import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

// Labelled input on-design: 48px target, hairline border, Sunset focus ring,
// caption-sized hint/error. Errors are announced to screen readers.
export function TextField({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: Props) {
  const inputId = id ?? props.name;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-small text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`border-hairline bg-surface text-body text-foreground placeholder:text-muted min-h-12 rounded-base border px-4 outline-none focus-visible:border-sunset focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sunset ${
          error ? "border-danger" : ""
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

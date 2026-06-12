import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  label,
  hint,
  error,
  id,
  name,
  className = "",
  ...props
}: Props) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-small text-foreground">
        {label}
      </label>
      <textarea
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={`border-hairline bg-surface text-body text-foreground placeholder:text-muted min-h-24 rounded-base border px-4 py-3 outline-none focus-visible:border-sunset focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sunset ${
          error ? "border-danger" : ""
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-caption text-danger">{error}</p>
      ) : hint ? (
        <p className="text-caption text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

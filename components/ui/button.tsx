import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "ease-out-soft inline-flex min-h-12 items-center justify-center gap-2 rounded-base px-5 text-h3 transition-[opacity,background-color,transform] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sunset";

const variants: Record<Variant, string> = {
  // One primary action per screen (Sunset).
  primary: "bg-accent-strong text-accent-contrast active:opacity-90",
  secondary:
    "border-hairline border bg-transparent text-savanna active:bg-accent-soft",
  ghost: "bg-transparent text-foreground active:bg-accent-soft",
  danger: "bg-danger text-white active:opacity-90",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

// Shared button styles for the design system. For link-styled actions, reuse
// `buttonClasses` on a Next <Link>.
export function buttonClasses(variant: Variant = "primary", fullWidth = false) {
  return `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""}`;
}

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`${buttonClasses(variant, fullWidth)} ${className}`}
      {...props}
    />
  );
}

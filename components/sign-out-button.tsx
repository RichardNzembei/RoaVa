import { signOut } from "@/app/actions/auth";

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  return (
    <form action={signOut}>
      <button type="submit" className="text-small text-muted active:text-foreground">
        {label}
      </button>
    </form>
  );
}

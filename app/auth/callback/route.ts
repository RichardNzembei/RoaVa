import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (Google) + email-link return here. Supabase appends `?code=...`; we
// exchange it for a session (the PKCE verifier cookie was set by the browser
// client), then route to onboarding until the name is captured, else `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=oauth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=oauth`);
  }

  // Send first-time users (no name yet) through onboarding.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    if (!data?.name) {
      return NextResponse.redirect(
        `${origin}/onboarding?next=${encodeURIComponent(next)}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

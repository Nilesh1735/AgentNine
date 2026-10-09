import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSafeAuthRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : requestUrl.origin;
  const nextPath = getSafeAuthRedirectPath(requestUrl.searchParams.get("next"), "/account");
  const errorPath = getSafeAuthRedirectPath(requestUrl.searchParams.get("errorPath"), "/login");
  const code = requestUrl.searchParams.get("code");

  function redirect(path: string, authError = false) {
    const destination = new URL(path, redirectOrigin);
    if (authError) destination.searchParams.set("authError", "oauth");
    return NextResponse.redirect(destination);
  }

  if (!code) return redirect(errorPath, true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase OAuth callback is missing public Supabase configuration.");
    return redirect(errorPath, true);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn("Supabase OAuth callback code exchange failed", {
        status: error.status,
        code: error.code,
      });
      return redirect(errorPath, true);
    }
  } catch (error) {
    console.error("Supabase OAuth callback request failed", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return redirect(errorPath, true);
  }

  return redirect(nextPath);
}

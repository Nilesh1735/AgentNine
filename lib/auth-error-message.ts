type AuthErrorDetails = {
  message: string;
  status?: number;
  code?: string;
};

type AuthMode = "login" | "signup";

export function getAuthErrorMessage(error: AuthErrorDetails, mode: AuthMode): string {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message.toLowerCase();

  if (error.status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return mode === "signup"
      ? "Too many signup or confirmation-email attempts. Wait a while before trying again. If this keeps happening, check the account email settings."
      : "Too many sign-in attempts. Wait a while before trying again.";
  }

  if (code === "email_exists" || code === "user_already_exists" || message.includes("already registered")) {
    return "An account with this email already exists. Try logging in.";
  }

  if (code === "email_address_invalid") {
    return "Supabase rejected this email address. Check the address for typos or contact support if it is valid.";
  }

  if (code === "weak_password") {
    return "Choose a stronger password that meets the account password requirements.";
  }

  if (code === "signup_disabled" || code === "email_provider_disabled") {
    return "Account creation is currently disabled. Please contact support.";
  }

  if (code === "invalid_credentials" || message.includes("invalid login")) {
    return "Those email or password details were not accepted.";
  }

  return mode === "signup"
    ? "We could not create your account. Try again later. If it keeps happening, contact support."
    : "We could not sign you in. Try again later. If it keeps happening, contact support.";
}

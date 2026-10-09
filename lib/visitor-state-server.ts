import { NextResponse } from "next/server";

export const VISITOR_COOKIE_NAME = "agentnine_visitor";
const LEGACY_VISITOR_COOKIE_NAME = "agenthive_visitor";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isVisitorId(value: string | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function getVisitorId(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .reduce((result, part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return result;
      result.set(part.slice(0, separator), part.slice(separator + 1));
      return result;
    }, new Map<string, string>());
  const currentValue = cookies.get(VISITOR_COOKIE_NAME);
  if (isVisitorId(currentValue)) return currentValue;
  const legacyValue = cookies.get(LEGACY_VISITOR_COOKIE_NAME);
  return isVisitorId(legacyValue) ? legacyValue : null;
}

export function attachVisitorCookie(response: Response, visitorId: string) {
  if (response instanceof NextResponse) {
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 31_536_000,
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(LEGACY_VISITOR_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

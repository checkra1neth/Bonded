import type { NextResponse } from "next/server";
import {
  NONCE_COOKIE_MAX_AGE,
  NONCE_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME,
} from "./constants";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
};

export function setNonceCookie(response: NextResponse, nonce: string) {
  response.cookies.set({
    ...baseCookieOptions,
    name: NONCE_COOKIE_NAME,
    value: nonce,
    maxAge: NONCE_COOKIE_MAX_AGE,
  });
}

export function clearNonceCookie(response: NextResponse) {
  response.cookies.set({
    ...baseCookieOptions,
    name: NONCE_COOKIE_NAME,
    value: "",
    maxAge: 0,
  });
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    ...baseCookieOptions,
    name: SESSION_COOKIE_NAME,
    value: token,
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...baseCookieOptions,
    name: SESSION_COOKIE_NAME,
    value: "",
    maxAge: 0,
  });
}

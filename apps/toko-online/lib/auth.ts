import { getClientIp } from "@tpl/core";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { authSecret, trustedProxies } from "./env";
import { limiters } from "./limiters";
import { cekKredensial } from "./login";

export const SESSION_MAX_AGE = 8 * 60 * 60; // 8 jam

const secure = () => (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

/**
 * Konfigurasi NextAuth v4: kredensial (email + password bcrypt), sesi JWT dalam cookie httpOnly SameSite=Strict.
 * Tanpa NEXTAUTH_SECRET (≥ 32 karakter) login tidak berfungsi (fail closed): authorize selalu menolak.
 */
export function buildAuthOptions(): NextAuthOptions {
  const opt = (httpOnly: boolean) => ({
    httpOnly,
    sameSite: "strict" as const,
    path: "/",
    secure: secure(),
  });
  const pre = secure() ? "__Secure-" : "";
  return {
    secret: authSecret() ?? undefined,
    session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
    jwt: { maxAge: SESSION_MAX_AGE },
    pages: { signIn: "/admin/login", error: "/admin/login" },
    cookies: {
      sessionToken: { name: `${pre}next-auth.session-token`, options: opt(true) },
      callbackUrl: { name: `${pre}next-auth.callback-url`, options: opt(true) },
      csrfToken: {
        name: `${secure() ? "__Host-" : ""}next-auth.csrf-token`,
        options: opt(true),
      },
    },
    providers: [
      CredentialsProvider({
        name: "Email & password",
        credentials: { email: { type: "email" }, password: { type: "password" } },
        async authorize(credentials, req) {
          if (!authSecret()) throw new Error("NONAKTIF");
          const ip = getClientIp(
            new Headers(
              Object.entries(req.headers ?? {}).map(([k, v]): [string, string] => [k, String(v)]),
            ),
            trustedProxies(),
          );
          const l = limiters();
          const hasil = await cekKredensial(credentials, ip, {
            cariUser: (email) => db().user.findUnique({ where: { email } }),
            limiterIp: (k) => l.loginIp.check(k),
            limiterEmail: (k) => l.loginEmail.check(k),
          });
          if (!hasil.ok) throw new Error(hasil.galat);
          const u = hasil.user;
          return { id: String(u.id), name: u.name, email: u.email, role: u.role };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.uid = Number(user.id);
          token.role = user.role;
        }
        return token;
      },
      async session({ session, token }) {
        // Hanya data non-rahasia (tanpa passwordHash). Peran yang berlaku dicek ulang ke DB di lib/session.ts.
        session.user = {
          id: token.uid as number,
          name: session.user?.name ?? "",
          email: session.user?.email ?? "",
          role: (token.role as string) ?? "",
        };
        return session;
      },
    },
  };
}

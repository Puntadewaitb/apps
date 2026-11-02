import bcrypt from "bcryptjs";
import { loginSchema, type LoginGalat } from "./auth-core";

export type UserRow = {
  id: number;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
};
type Check = (key: string) => { allowed: boolean };

export type LoginDeps = {
  cariUser: (email: string) => Promise<UserRow | null>;
  limiterIp: Check;
  limiterEmail: Check;
};

/**
 * Hash palsu (dibuat sekali, malas) yang tak cocok dengan password mana pun — dipakai agar waktu respons
 * kira-kira sama bila email tak terdaftar (cegah enumerasi akun lewat timing).
 */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash(`dummy-${Math.random()}`, 12));

export type HasilLogin = { ok: true; user: UserRow } | { ok: false; galat: LoginGalat };

/**
 * Verifikasi kredensial. Urutan: validasi bentuk → rate limit (IP, lalu akun) → cari user → bcrypt.
 * Email tak terdaftar dan password salah menghasilkan galat yang sama (tak membocorkan keberadaan akun).
 */
export async function cekKredensial(
  input: unknown,
  ip: string,
  deps: LoginDeps,
): Promise<HasilLogin> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, galat: "KREDENSIAL" };
  const { email, password } = parsed.data;

  if (!deps.limiterIp(`ip:${ip}`).allowed) return { ok: false, galat: "RATE_LIMIT" };
  if (!deps.limiterEmail(`email:${email}`).allowed) return { ok: false, galat: "RATE_LIMIT" };

  const user = await deps.cariUser(email);
  const cocok = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !cocok) return { ok: false, galat: "KREDENSIAL" };
  return { ok: true, user };
}

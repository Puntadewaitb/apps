import bcrypt from "bcryptjs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { cekKredensial, type LoginDeps, type UserRow } from "./login";

let user: UserRow;
beforeAll(async () => {
  user = {
    id: 7,
    email: "admin@sekolah.example",
    name: "Admin",
    role: "ADMIN",
    passwordHash: await bcrypt.hash("password-benar-123", 4),
  };
});

const deps = (over: Partial<LoginDeps> = {}): LoginDeps => ({
  cariUser: async (email) => (email === user.email ? user : null),
  limiterIp: () => ({ allowed: true }),
  limiterEmail: () => ({ allowed: true }),
  ...over,
});

describe("cekKredensial", () => {
  it("kredensial benar → ok dengan data user", async () => {
    const r = await cekKredensial(
      { email: "Admin@Sekolah.Example", password: "password-benar-123" },
      "1.2.3.4",
      deps(),
    );
    expect(r).toMatchObject({ ok: true, user: { id: 7, role: "ADMIN" } });
  });

  it("password salah dan email tak terdaftar → galat IDENTIK (tidak membocorkan akun)", async () => {
    const a = await cekKredensial({ email: user.email, password: "salah" }, "1.2.3.4", deps());
    const b = await cekKredensial(
      { email: "tidak@ada.example", password: "password-benar-123" },
      "1.2.3.4",
      deps(),
    );
    expect(a).toEqual({ ok: false, galat: "KREDENSIAL" });
    expect(b).toEqual(a);
  });

  it("input tak valid ditolak sebelum menyentuh limiter/DB", async () => {
    const cari = vi.fn();
    const lim = vi.fn(() => ({ allowed: true }));
    for (const input of [
      null,
      undefined,
      {},
      { email: "x", password: "y" },
      { email: user.email },
      "string",
      { email: user.email, password: 123 },
    ]) {
      const r = await cekKredensial(
        input,
        "ip",
        deps({ cariUser: cari, limiterIp: lim, limiterEmail: lim }),
      );
      expect(r, JSON.stringify(input)).toEqual({ ok: false, galat: "KREDENSIAL" });
    }
    expect(cari).not.toHaveBeenCalled();
    expect(lim).not.toHaveBeenCalled();
  });

  it("rate limit IP atau akun → RATE_LIMIT walau password benar; DB tak disentuh", async () => {
    const cari = vi.fn(async () => user);
    const ok = { email: user.email, password: "password-benar-123" };
    expect(
      await cekKredensial(
        ok,
        "ip",
        deps({ cariUser: cari, limiterIp: () => ({ allowed: false }) }),
      ),
    ).toEqual({
      ok: false,
      galat: "RATE_LIMIT",
    });
    expect(
      await cekKredensial(
        ok,
        "ip",
        deps({ cariUser: cari, limiterEmail: () => ({ allowed: false }) }),
      ),
    ).toEqual({
      ok: false,
      galat: "RATE_LIMIT",
    });
    expect(cari).not.toHaveBeenCalled();
  });

  it("kunci limiter memuat IP dan email ternormalisasi", async () => {
    const ip = vi.fn(() => ({ allowed: true }));
    const em = vi.fn(() => ({ allowed: true }));
    await cekKredensial(
      { email: " USER@X.example ", password: "p" },
      "9.9.9.9",
      deps({ limiterIp: ip, limiterEmail: em }),
    );
    expect(ip).toHaveBeenCalledWith("ip:9.9.9.9");
    expect(em).toHaveBeenCalledWith("email:user@x.example");
  });

  it("hash rusak/kosong di DB → ditolak (bukan crash atau lolos)", async () => {
    for (const passwordHash of ["", "bukan-hash", "$2b$12$tooshort"]) {
      const r = await cekKredensial(
        { email: user.email, password: "apa-saja" },
        "ip",
        deps({ cariUser: async () => ({ ...user, passwordHash }) }),
      );
      expect(r, passwordHash).toEqual({ ok: false, galat: "KREDENSIAL" });
    }
  });
});

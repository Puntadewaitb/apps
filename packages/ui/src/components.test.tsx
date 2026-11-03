import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Accordion,
  Badge,
  Button,
  ButtonLink,
  Card,
  Container,
  Footer,
  FormField,
  Lightbox,
  Modal,
  Navbar,
  Section,
  ToastProvider,
  WhatsAppButton,
  buildWhatsAppUrl,
  cn,
} from "./index";

const render = renderToStaticMarkup;

describe("util", () => {
  it("cn membuang nilai falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
  it("buildWhatsAppUrl hanya menyisakan digit & meng-encode pesan", () => {
    expect(buildWhatsAppUrl("+62 812-3456-7890")).toBe("https://wa.me/6281234567890");
    expect(buildWhatsAppUrl("6281", "Halo, saya mau tanya")).toBe(
      "https://wa.me/6281?text=Halo%2C%20saya%20mau%20tanya",
    );
  });
});

describe("render komponen", () => {
  it("Button", () => {
    const html = render(<Button variant="secondary">Kirim</Button>);
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
    expect(html).toContain("Kirim");
  });

  it("ButtonLink", () => {
    const html = render(<ButtonLink href="/kontak">Hubungi</ButtonLink>);
    expect(html).toContain("<a ");
    expect(html).toContain('href="/kontak"');
  });

  it("Container", () => {
    expect(render(<Container>isi</Container>)).toContain("max-w-6xl");
  });

  it("Section dengan judul", () => {
    const html = render(
      <Section title="Judul" subtitle="Sub" tone="surface">
        konten
      </Section>,
    );
    expect(html).toContain("<section");
    expect(html).toContain("<h2");
    expect(html).toContain("Judul");
    expect(html).toContain("bg-surface");
  });

  it("Navbar menampilkan brand, link, dan tombol menu mobile", () => {
    const html = render(
      <Navbar brand="Maju Jaya" links={[{ label: "Beranda", href: "#beranda" }]} />,
    );
    expect(html).toContain("Maju Jaya");
    expect(html).toContain('href="#beranda"');
    expect(html).toContain('aria-label="Buka menu"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("Navbar & Footer: label aksesibilitas default Indonesia, bisa ditimpa (situs multi-bahasa)", () => {
    const def = render(<Navbar brand="X" links={[{ label: "Home", href: "/" }]} />);
    expect(def).toContain('aria-label="Navigasi utama"');
    const en = render(
      <Navbar
        brand="X"
        links={[{ label: "Home", href: "/" }]}
        labels={{ nav: "Main navigation", open: "Open menu" }}
      />,
    );
    expect(en).toContain('aria-label="Main navigation"');
    expect(en).toContain('aria-label="Open menu"');
    expect(en).not.toContain("Buka menu");
    expect(render(<Footer brand="X" links={[{ label: "A", href: "/a" }]} />)).toContain(
      'aria-label="Tautan footer"',
    );
    expect(
      render(<Footer brand="X" links={[{ label: "A", href: "/a" }]} navLabel="Footer links" />),
    ).toContain('aria-label="Footer links"');
  });

  it("Navbar: `actions` tampil di bar (di luar menu) dan sebelum tombol hamburger; tanpa actions tidak ada pembungkus", () => {
    const dengan = render(
      <Navbar brand="X" links={[]} actions={<a href="/keranjang">Keranjang</a>} />,
    );
    expect(dengan).toContain('href="/keranjang"');
    expect(dengan.indexOf("Keranjang")).toBeLessThan(dengan.indexOf('aria-label="Buka menu"'));
    const tanpa = render(<Navbar brand="X" links={[]} />);
    expect(tanpa).not.toContain("keranjang");
    expect(tanpa).toContain('aria-label="Buka menu"');
  });

  it("Footer", () => {
    const html = render(
      <Footer
        brand="Maju Jaya"
        description="Deskripsi"
        links={[{ label: "Privasi", href: "/privasi" }]}
        copyright="© 2026 Maju Jaya"
      />,
    );
    expect(html).toContain("<footer");
    expect(html).toContain("Privasi");
    expect(html).toContain("© 2026 Maju Jaya");
  });

  it("WhatsAppButton", () => {
    const html = render(<WhatsAppButton phone="6281234567890" message="Halo" />);
    expect(html).toContain('href="https://wa.me/6281234567890?text=Halo"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("fixed");
  });

  it("Card", () => {
    expect(render(<Card>isi</Card>)).toContain("rounded-lg");
  });

  it("Badge", () => {
    const html = render(<Badge tone="success">Aktif</Badge>);
    expect(html).toContain("Aktif");
    expect(html).toContain("text-success");
  });

  it("Accordion: hanya item defaultOpenId yang terbuka", () => {
    const html = render(
      <Accordion
        defaultOpenId="a"
        items={[
          { id: "a", title: "Satu", content: "Isi satu" },
          { id: "b", title: "Dua", content: "Isi dua" },
        ]}
      />,
    );
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(1);
    expect(html).toContain("hidden");
  });

  it("Modal tertutup tidak merender apa pun, terbuka merender dialog", () => {
    expect(render(<Modal open={false} onClose={() => {}} title="X" />)).toBe("");
    const html = render(
      <Modal open onClose={() => {}} title="Konfirmasi">
        Yakin?
      </Modal>,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Konfirmasi");
    expect(html).toContain("Yakin?");
  });

  it("Lightbox merender thumbnail", () => {
    const html = render(
      <Lightbox
        images={[
          { src: "/img/a.svg", alt: "Foto A" },
          { src: "/img/b.svg", alt: "Foto B" },
        ]}
      />,
    );
    expect(html.match(/<img /g)).toHaveLength(2);
    expect(html).toContain('alt="Foto A"');
    expect(html).not.toContain('role="dialog"');
  });

  it("ToastProvider merender anak + region status", () => {
    const html = render(
      <ToastProvider>
        <p>halaman</p>
      </ToastProvider>,
    );
    expect(html).toContain("halaman");
    expect(html).toContain('role="status"');
  });

  it("FormField menghubungkan label, hint, dan error ke input", () => {
    const html = render(
      <FormField label="Nama" hint="Nama lengkap" error="Wajib diisi" required>
        <input name="nama" />
      </FormField>,
    );
    const id = /<label for="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain(`aria-describedby="${id}-hint ${id}-error"`);
    expect(html).toContain('role="alert"');
    expect(html).toContain("required");
  });
});

describe("design tokens", () => {
  const css = readFileSync(new URL("../theme.css", import.meta.url), "utf8");
  it("punya 3 palet tema", () => {
    for (const t of ["netral", "hangat", "hijau"]) {
      expect(css).toContain(`[data-theme="${t}"]`);
    }
  });
  it("tiap palet mendefinisikan token inti", () => {
    for (const v of ["--primary:", "--bg:", "--fg:", "--border:"]) {
      expect(css.split(v).length - 1).toBeGreaterThanOrEqual(3);
    }
  });
});

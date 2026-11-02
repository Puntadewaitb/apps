import type { portofolio as portofolioId } from "./portofolio.id";

/** English portfolio (FICTIONAL clients/figures). Slugs and category ids MUST match `portofolio.id.ts`. */
export const portofolio: typeof portofolioId = {
  judul: "Portfolio",
  pengantar: "A selection of projects we have delivered with clients across industries.",
  catatan:
    "All clients, projects, and figures on this page are fictional, for template demo purposes.",
  filter: {
    semua: "All",
    label: "Filter projects by category",
    kosong: "There are no projects in this category yet.",
  },
  kategori: [
    { id: "proses", nama: "Business Process", layanan: "konsultasi-proses-bisnis" },
    { id: "sistem", nama: "Digital Systems", layanan: "pengembangan-sistem" },
    { id: "data", nama: "Data Analytics", layanan: "analitik-data" },
    { id: "pelatihan", nama: "People Training", layanan: "pelatihan-sdm" },
  ],
  proyek: [
    {
      slug: "standarisasi-pergudangan-nusa",
      judul: "Warehouse Process Standardization",
      klien: "PT Nusa Distribusi",
      kategori: "proses",
      tahun: 2023,
      ringkas:
        "Mapping and simplifying the flow from receiving to shipping across three warehouses.",
      tantangan:
        "Each warehouse worked differently, so stock often mismatched and shipments ran late.",
      solusi:
        "We mapped all three warehouses, defined one standard flow with SOPs, and coached the pilot over eight weeks.",
      hasil: [
        "Stock discrepancies down 42%",
        "Order preparation time down 28%",
        "Uniform SOPs across 3 warehouses",
      ],
      teknologi: ["Process mapping", "SOPs", "Performance indicators"],
      gambar: "/img/proyek-1.svg",
    },
    {
      slug: "portal-pemesanan-sentosa",
      judul: "Partner Ordering Portal",
      klien: "CV Sentosa Abadi",
      kategori: "sistem",
      tahun: 2024,
      ringkas:
        "A web portal so partners can order, track, and pay without chains of chat messages.",
      tantangan:
        "Partner orders arrived via chat and phone, so they were easy to miss and hard to track.",
      solusi:
        "An ordering portal with a catalog, order history, and status notifications, connected to the existing stock system.",
      hasil: [
        "Order entry errors down 60%",
        "Order confirmation from 1 day to 2 hours",
        "120 active partners within 3 months",
      ],
      teknologi: ["Web application", "API integration", "WhatsApp notifications"],
      gambar: "/img/proyek-2.svg",
    },
    {
      slug: "dasbor-penjualan-lestari",
      judul: "Multi-Branch Sales Dashboard",
      klien: "Lestari Retail",
      kategori: "data",
      tahun: 2024,
      ringkas: "One dashboard to monitor sales, margin, and stock across 18 branches every day.",
      tantangan:
        "Branch reports were sent as Excel files and only came together at the end of the week.",
      solusi:
        "We unified point-of-sale data from every branch, defined the indicators, and built a daily dashboard readable on a phone.",
      hasil: [
        "Daily reports instead of weekly",
        "Slow-moving products spotted 3× faster",
        "15 hours/week of manual recaps eliminated",
      ],
      teknologi: ["Data unification", "Dashboard", "Automated reports"],
      gambar: "/img/proyek-3.svg",
    },
    {
      slug: "pelatihan-erp-karya",
      judul: "ERP User Training Program",
      klien: "Karya Manufaktur",
      kategori: "pelatihan",
      tahun: 2022,
      ringkas: "Phased training for 240 users so the move to a new ERP went smoothly.",
      tantangan:
        "The new ERP was launched but many users were reluctant and went back to manual files.",
      solusi:
        "Training modules built on real company cases, per-unit sessions, and competency evaluation before and after.",
      hasil: [
        "92% of participants passed the evaluation",
        "Help tickets down 55% within 2 months",
        "Modules became an internal training asset",
      ],
      teknologi: ["Training modules", "Case studies", "Competency evaluation"],
      gambar: "/img/proyek-4.svg",
    },
    {
      slug: "antrian-klinik-sehat-prima",
      judul: "Queue & Visit Records System",
      klien: "Klinik Sehat Prima",
      kategori: "sistem",
      tahun: 2023,
      ringkas:
        "Online registration, queue numbers, and visit records for a clinic with five departments.",
      tantangan:
        "Patients waited long without certainty, and visit data was recorded in notebooks.",
      solusi:
        "Online registration with waiting-time estimates, a waiting-room queue display, and centralized visit records with role-based access.",
      hasil: [
        "Average waiting time down 35%",
        "Online registration used by 64% of patients",
        "Visit data stored securely and searchable",
      ],
      teknologi: ["Web application", "Role-based access", "Queue display"],
      gambar: "/img/proyek-5.svg",
    },
    {
      slug: "pemetaan-pengiriman-samudra",
      judul: "Delivery Process Mapping",
      klien: "Samudra Logistik",
      kategori: "proses",
      tahun: 2022,
      ringkas: "Finding bottlenecks in the inter-city delivery flow and redesigning the handovers.",
      tantangan: "Shipments were often held at transit points with no clear owner.",
      solusi:
        "End-to-end flow mapping, an owner at every handover point, and weekly delay indicators.",
      hasil: [
        "Delays down 31%",
        "Clear owners at 9 transit points",
        "Weekly indicators monitored by leadership",
      ],
      teknologi: ["Process mapping", "Responsibility matrix", "Performance indicators"],
      gambar: "/img/proyek-6.svg",
    },
  ],
};

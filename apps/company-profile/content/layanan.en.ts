import type { layanan as layananId } from "./layanan.id";

/** English version of the services (FICTIONAL). Slugs MUST match `layanan.id.ts`. */
export const layanan: typeof layananId = [
  {
    slug: "konsultasi-proses-bisnis",
    nama: "Business Process Consulting",
    ikon: "🧭",
    ringkas:
      "Map, simplify, and standardize your workflows so work gets done faster with fewer mistakes.",
    deskripsi: [
      "Many companies grow faster than their processes. Work that used to live in one person's head now involves many people and systems, causing duplicate work, delays, and repeated mistakes.",
      "Our consultants map how work actually flows today, find the most expensive bottlenecks, and design a new flow your team can realistically run.",
    ],
    manfaat: [
      "Shorter turnaround time for work",
      "Clear responsibility for every role",
      "Fewer mistakes and less rework",
      "A solid foundation before digitization",
    ],
    tahapan: [
      {
        judul: "Diagnosis",
        teks: "Interviews and observation to map the current process (as-is).",
      },
      { judul: "Analysis", teks: "Measuring bottlenecks, costs, and risks to set priorities." },
      {
        judul: "Design",
        teks: "Drafting the target process (to-be) with SOPs and performance indicators.",
      },
      {
        judul: "Coaching",
        teks: "Piloting with your team and adjusting until the process runs steadily.",
      },
    ],
    hasil: ["Process maps (as-is & to-be)", "Ready-to-use SOPs", "Performance indicator dashboard"],
    faq: [
      {
        id: "durasi",
        q: "How long does a project usually take?",
        a: "Typically 6–12 weeks depending on how many processes are covered. We agree on scope and schedule before we start.",
      },
      {
        id: "tim",
        q: "Will our team need to spend a lot of time?",
        a: "We design short, scheduled sessions — on average 2–3 hours per week per unit representative.",
      },
      {
        id: "lanjut",
        q: "Can it continue into building a system?",
        a: "Yes. The analysis becomes the requirements baseline, so moving into development is faster and better targeted.",
      },
    ],
    terkait: ["pengembangan-sistem", "pelatihan-sdm"],
  },
  {
    slug: "pengembangan-sistem",
    nama: "Digital System Development",
    ikon: "💻",
    ringkas:
      "Web applications and system integrations built around your business process — not the other way around.",
    deskripsi: [
      "We build internal applications, customer portals, and integrations that fit how your company works, delivered in stages so the value shows from the first release.",
      "The code and documentation belong to you. We use common technology so your internal team or another vendor can maintain it easily.",
    ],
    manfaat: [
      "Staged releases, value felt early",
      "Code & documentation owned by the client",
      "Common technology, easy to maintain",
      "Security and data backups from day one",
    ],
    tahapan: [
      { judul: "Requirements", teks: "Agreeing on priority features and measures of success." },
      { judul: "Design", teks: "Flow and interface prototypes tested with real users." },
      { judul: "Build", teks: "Two-week iterations with regular demos." },
      {
        judul: "Launch & support",
        teks: "Data migration, user training, and an initial support period.",
      },
    ],
    hasil: [
      "Production-ready application",
      "Technical documentation & user guide",
      "Tests and backup scripts",
    ],
    faq: [
      {
        id: "kepemilikan",
        q: "Who owns the source code?",
        a: "You do. All code, designs, and documentation are handed over when the project is complete.",
      },
      {
        id: "rawat",
        q: "Do you offer maintenance?",
        a: "Yes — monthly plans covering bug fixes, security updates, and small adjustments.",
      },
      {
        id: "integrasi",
        q: "Can it connect to our existing systems?",
        a: "Yes, as long as those systems offer an API or data export. We assess feasibility in the first phase.",
      },
    ],
    terkait: ["konsultasi-proses-bisnis", "analitik-data"],
  },
  {
    slug: "analitik-data",
    nama: "Analytics & Data Dashboards",
    ikon: "📊",
    ringkas: "Combine data from many sources into dashboards that help leaders make decisions.",
    deskripsi: [
      "Sales, finance, and operations data are often scattered across files and systems. We tidy the sources and build dashboards that answer the questions leaders actually ask.",
      "We focus on a few indicators that matter and can be trusted — not dozens of charts nobody uses.",
    ],
    manfaat: [
      "One source of truth for key numbers",
      "Automated reports instead of manual recaps",
      "Trends and anomalies spotted sooner",
      "Decisions based on data, not guesses",
    ],
    tahapan: [
      {
        judul: "Choose indicators",
        teks: "Selecting business questions and key indicators with leadership.",
      },
      { judul: "Unify data", teks: "Cleaning and combining data from multiple sources." },
      { judul: "Dashboard", teks: "Building concise, easy-to-read visualizations." },
      { judul: "Handover", teks: "User training and a guide for updating indicators." },
    ],
    hasil: [
      "Interactive dashboard",
      "Data dictionary & indicator definitions",
      "Automated periodic reports",
    ],
    faq: [
      {
        id: "sumber",
        q: "Which data sources are supported?",
        a: "Excel/CSV files, common databases, and systems that provide an API.",
      },
      {
        id: "keamanan",
        q: "How is our data kept secure?",
        a: "Role-based access, encryption in transit, and data stays in the environment you choose.",
      },
      {
        id: "realtime",
        q: "Is the data real-time?",
        a: "It depends on the need: from daily refreshes to near real-time for certain indicators.",
      },
    ],
    terkait: ["pengembangan-sistem", "konsultasi-proses-bisnis"],
  },
  {
    slug: "pelatihan-sdm",
    nama: "Training & People Development",
    ikon: "🎓",
    ringkas:
      "Practical training programs so your team can use new processes and systems with confidence.",
    deskripsi: [
      "The best system is useless if the team isn't comfortable with it. We prepare training based on real cases from your company, complete with modules and exercises.",
      "Training can take place at your office or online, for small groups or whole units.",
    ],
    manfaat: [
      "Materials built from your company's real cases",
      "Users become productive faster",
      "Modules and recordings become internal assets",
      "Before-and-after measurement of results",
    ],
    tahapan: [
      { judul: "Needs analysis", teks: "Assessing starting skills and setting training goals." },
      { judul: "Module design", teks: "Preparing materials, case studies, and exercises." },
      { judul: "Delivery", teks: "Interactive in-person or online sessions." },
      { judul: "Evaluation", teks: "Competency test and follow-up recommendations." },
    ],
    hasil: ["Training modules", "Session recordings (if online)", "Participant evaluation report"],
    faq: [
      {
        id: "peserta",
        q: "What is the ideal number of participants per session?",
        a: "10–25 participants to keep it interactive. Larger groups are split into several sessions.",
      },
      {
        id: "sertifikat",
        q: "Do participants receive a certificate?",
        a: "Yes — an attendance certificate; a competency certificate is available for those who pass the evaluation.",
      },
      {
        id: "daring",
        q: "Can it be delivered online?",
        a: "Yes, complete with group exercises and live Q&A.",
      },
    ],
    terkait: ["konsultasi-proses-bisnis", "pengembangan-sistem"],
  },
];

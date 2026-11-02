import type { tentang as tentangId } from "./tentang.id";

export const tentang: typeof tentangId = {
  judul: "About Us",
  pengantar:
    "Cakra Mandiri was founded in 2012 on a simple belief: companies grow healthiest when their processes, systems, and people develop together.",
  sejarah: {
    judul: "Our Journey",
    peristiwa: [
      {
        tahun: "2012",
        judul: "Founded",
        teks: "Established by three consultants focused on improving business processes for distribution companies.",
      },
      {
        tahun: "2016",
        judul: "Technology Division",
        teks: "Formed a development team to build systems that grow out of process analysis.",
      },
      {
        tahun: "2020",
        judul: "Online Services",
        teks: "All coaching and training became available online during the mobility restrictions.",
      },
      {
        tahun: "2024",
        judul: "Data Analytics",
        teks: "Launched analytics and data dashboard services for company leaders.",
      },
    ],
  },
  visiMisi: {
    visi: "To be the trusted partner of Indonesian mid-sized companies in growing in a measurable and sustainable way.",
    misi: [
      "Give practical, actionable recommendations — not just reports.",
      "Build solutions that are easy to maintain and fully owned by the client.",
      "Develop clients' teams so they are self-reliant after the project ends.",
      "Protect the confidentiality and security of client data at every stage.",
    ],
  },
  nilai: [
    { judul: "Practical", teks: "We favor steps that can be taken this week." },
    { judul: "Transparent", teks: "Scope, costs, and progress are shared openly." },
    { judul: "Accountable", teks: "We answer for results, not just activities." },
    { judul: "Always learning", teks: "We share knowledge and learn from every project." },
  ],
  tim: {
    judul: "Leadership Team",
    anggota: [
      {
        nama: "Andini Prameswari",
        jabatan: "Chief Executive Officer",
        bio: "Business process consultant with 18 years of experience in distribution and manufacturing.",
        foto: "/img/tim-1.svg",
      },
      {
        nama: "Bayu Wicaksono",
        jabatan: "Chief Technology Officer",
        bio: "Software engineer who has led system builds for dozens of clients.",
        foto: "/img/tim-2.svg",
      },
      {
        nama: "Citra Maharani",
        jabatan: "Head of Data Analytics",
        bio: "Analytics expert who turns data into indicators that are easy to decide on.",
        foto: "/img/tim-3.svg",
      },
      {
        nama: "Dimas Hardiansyah",
        jabatan: "Head of Training",
        bio: "Experienced facilitator in system user training and people development.",
        foto: "/img/tim-4.svg",
      },
    ],
  },
};

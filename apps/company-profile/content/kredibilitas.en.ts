import type { kredibilitas as kredibilitasId } from "./kredibilitas.id";

export const kredibilitas: typeof kredibilitasId = {
  angka: {
    judul: "Trusted since 2012",
    butir: [
      { nilai: "150+", label: "Projects delivered" },
      { nilai: "80+", label: "Active & alumni clients" },
      { nilai: "12", label: "Years of experience" },
      { nilai: "96%", label: "Clients recommend us" },
    ],
    catatan: "The figures above are fictional, for template demo purposes.",
  },
  klien: {
    judul: "Clients & Partners",
    subjudul: "Companies across industries that have worked with us.",
    daftar: [
      { nama: "Nusa Distribusi", logo: "/img/klien-1.svg" },
      { nama: "Sentosa Abadi", logo: "/img/klien-2.svg" },
      { nama: "Lestari Retail", logo: "/img/klien-3.svg" },
      { nama: "Karya Manufaktur", logo: "/img/klien-4.svg" },
      { nama: "Klinik Sehat Prima", logo: "/img/klien-5.svg" },
      { nama: "Samudra Logistik", logo: "/img/klien-6.svg" },
      { nama: "Mitra Cloud", logo: "/img/klien-7.svg" },
      { nama: "Aksara Edukasi", logo: "/img/klien-8.svg" },
    ],
  },
  testimoni: {
    judul: "What Our Clients Say",
    catatan: "The names and testimonials below are fictional examples for template demo purposes.",
    daftar: [
      {
        nama: "Hendra Gunawan",
        jabatan: "Operations Director",
        perusahaan: "PT Nusa Distribusi",
        teks: "The Cakra Mandiri team didn't just hand us a report — they came down to the warehouse. The SOPs they wrote are actually used by our team.",
        rating: 5,
      },
      {
        nama: "Maya Anggraini",
        jabatan: "Owner",
        perusahaan: "CV Sentosa Abadi",
        teks: "The ordering portal was finished on time and our partners loved it right away. The documentation is complete, so it's easy for us to extend.",
        rating: 5,
      },
      {
        nama: "Robert Santoso",
        jabatan: "Head of Finance",
        perusahaan: "Lestari Retail",
        teks: "The sales dashboard changed how our weekly meetings run. The numbers are the same across all branches and always up to date.",
        rating: 4,
      },
    ],
  },
};

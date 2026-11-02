import type { blog as blogId } from "./blog.id";

/** English blog configuration. Articles live in `content/blog/en/<slug>.md` (same slugs as Indonesian). */
export const blog: typeof blogId = {
  judul: "Blog",
  pengantar: "Tips, technology insights, and the latest news from Cakra Mandiri.",
  semua: "All",
  filterLabel: "Article categories",
  bacaLabel: "min read",
  catatan: "The articles on this blog are fictional, for template demo purposes.",
  kategori: [
    {
      id: "tips",
      nama: "Business Tips",
      deskripsi: "Practical advice for tidying up and growing your business.",
    },
    {
      id: "teknologi",
      nama: "Technology",
      deskripsi: "Discussions on digital systems, data, and security.",
    },
    { id: "berita", nama: "Company News", deskripsi: "News and announcements from Cakra Mandiri." },
  ],
};

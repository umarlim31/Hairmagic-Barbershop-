export const TEAM_MOMENT_CATEGORIES = [
  "Di Barbershop",
  "Hairmagic Trip",
  "Behind the Scenes",
  "Our Moments",
] as const;

export type TeamMomentCategory = (typeof TEAM_MOMENT_CATEGORIES)[number];

export type TeamMoment = {
  src: string;
  alt: string;
  category: TeamMomentCategory;
  title: string;
  caption: string;
  position?: string;
};

// HOW TO ADD NEW TEAM PHOTO: save an optimized photo in public/media/team,
// then add an entry below with its path, descriptive alt, category, title, and caption.
// To replace or remove a photo, edit or delete its entry here. Keep customer haircuts in lib/gallery.ts.
export const TEAM_MOMENTS: TeamMoment[] = [
  {
    src: "/media/team/hairmagic-trip-waterfall-01.jpg",
    alt: "Tim Hairmagic berfoto bersama di depan air terjun",
    category: "Hairmagic Trip",
    title: "Waktu untuk jalan bersama",
    caption: "Sejenak meninggalkan kursi barber dan menikmati perjalanan sebagai satu tim.",
  },
  {
    src: "/media/team/hairmagic-trip-waterfall-02.jpg",
    alt: "Anggota tim Hairmagic berkumpul di tepi air terjun",
    category: "Hairmagic Trip",
    title: "Cerita di luar barbershop",
    caption: "Momen kecil yang membuat perjalanan bersama terasa dekat.",
  },
];

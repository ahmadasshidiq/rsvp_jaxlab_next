import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const dDin = localFont({
  src: [
    {
      path: "../../public/fonts/D-DIN.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/D-DIN-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/D-DIN-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-d-din",
  display: "swap",
});

const dDinCondensed = localFont({
  src: [
    {
      path: "../../public/fonts/D-DINCondensed.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/D-DINCondensed-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-d-din-condensed",
  display: "swap",
});

const dDinExpanded = localFont({
  src: [
    {
      path: "../../public/fonts/D-DINExp.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/D-DINExp-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/D-DINExp-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-d-din-expanded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RSVP JaxLab — Daftarkan Kehadiranmu",
  description:
    "Daftarkan kehadiran Anda di acara JaxLab. Pilih kategori VIP atau Reguler dan isi form RSVP untuk mengamankan tempat Anda.",
  keywords: ["RSVP", "JaxLab", "event", "pendaftaran", "daftar hadir"],
  openGraph: {
    title: "RSVP JaxLab",
    description: "Daftarkan kehadiran Anda di acara JaxLab",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${dDin.variable} ${dDinCondensed.variable} ${dDinExpanded.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" />
      </head>
      <body className={dDin.className}>
        {children}
      </body>
    </html>
  );
}

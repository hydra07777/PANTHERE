import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-loaded",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-loaded",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: "Panthère — Assistant éducatif IA",
  description:
    "Apprends avec un assistant qui ne donne jamais la réponse, mais t'aide à la trouver par toi-même.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable}`}
      style={{
        fontFamily:
          "var(--font-sans-loaded), Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <body>{children}</body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
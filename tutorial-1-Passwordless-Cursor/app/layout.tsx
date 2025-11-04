import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { KeycloakProvider } from "@/components/auth/keycloak-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VIA ZTF Security Controls",
  description: "Passwordless authentication with VIA ZTF - Security Controls To-Do App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <KeycloakProvider>
          {children}
        </KeycloakProvider>
      </body>
    </html>
  );
}


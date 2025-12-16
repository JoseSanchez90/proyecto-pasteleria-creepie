import type { Metadata } from "next";
import "./globals.css";
import { comfortaa, gabarito, pacifico } from "@/lib/fonts";
import NavbarHandler from "@/components/navbarHandler";
import FooterHandler from "@/components/footerHandler";
import NavbarHandlerMobile from "@/components/navbarHandlerMobile";
import { NotyfProvider } from "./providers/NotyfProvider";

export const metadata: Metadata = {
  title: "Creepie",
  description: "Pasteleria Creepie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body
        className={`${comfortaa.variable} ${pacifico.variable} ${gabarito.className} antialiased`}
      >
        <NotyfProvider>
          <div className="hidden lg:block">
            <NavbarHandler />
          </div>
          <div className="lg:hidden">
            <NavbarHandlerMobile />
          </div>
          <main className="bg-neutral-100">{children}</main>
          <FooterHandler />
        </NotyfProvider>
      </body>
    </html>
  );
}

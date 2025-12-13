import { Geist, Geist_Mono } from "next/font/google";
import { Comfortaa, Gabarito, Pacifico } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

export const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
});

export const gabarito = Gabarito({
  subsets: ["latin"],
  variable: "--font-gabarito",
  weight: ["400", "500", "600", "700", "800", "900"],
});

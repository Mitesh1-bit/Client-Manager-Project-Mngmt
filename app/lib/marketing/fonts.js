import { Plus_Jakarta_Sans } from "next/font/google";

export const mktDisplay = Plus_Jakarta_Sans({
  variable: "--font-mkt-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const mktSans = Plus_Jakarta_Sans({
  variable: "--font-mkt-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Class names that expose marketing font CSS variables on a wrapper element. */
export const mktFontClassName = `${mktDisplay.variable} ${mktSans.variable}`;

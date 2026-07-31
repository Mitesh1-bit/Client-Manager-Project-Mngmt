import { DM_Sans, Instrument_Serif } from "next/font/google";

export const mktDisplay = Instrument_Serif({
  variable: "--font-mkt-display",
  subsets: ["latin"],
  weight: "400",
});

export const mktSans = DM_Sans({
  variable: "--font-mkt-sans",
  subsets: ["latin"],
});

/** Class names that expose marketing font CSS variables on a wrapper element. */
export const mktFontClassName = `${mktDisplay.variable} ${mktSans.variable}`;

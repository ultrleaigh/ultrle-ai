import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
}); 

export const metadata = {
  title: "Ultrle AI",
  description: "Upload your lecture slides and get a personalised study plan, summaries, and practice questions in minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black">
        <Navbar />
        {children}
      </body>
    </html>
  );
} 
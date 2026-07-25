import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WEB MAKER | 직접 디자인하고 코딩하는 웹 스튜디오",
  description:
    "학생이 캔버스에서 직접 배치하고 디자인하며 HTML, CSS, JavaScript까지 편집하는 교육용 웹 제작 스튜디오입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}

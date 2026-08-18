import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./ui-final.css";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryBasePath = isGitHubPages ? (process.env.GITHUB_PAGES_BASE_PATH || "/er") : "";
const publicUrl = isGitHubPages
  ? "https://ydhfx5701-design.github.io/er/"
  : "https://waggle-town-2026.ydhfx5701.chatgpt.site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: "와글타운 | Waggle Town",
  description: "작은 네모콩 주민들이 열린 단면 마을과 지상 돌산을 오가며 생활하고 밤에는 자동 진형으로 싸우는 모바일 방어 게임",
  openGraph: {
    title: "와글타운 | Waggle Town",
    description: "따뜻한 픽셀 사이드뷰 속 작은 주민, 열린 단면 건물, 지상 돌산 채굴과 자동 진형 전투가 이어지는 살아있는 마을",
    url: isGitHubPages ? `${repositoryBasePath}/` : "/",
    siteName: "와글타운",
    type: "website",
    images: [{ url: `${repositoryBasePath}/og.png`, width: 1200, height: 630, alt: "와글타운의 지상 돌산과 열린 단면 마을" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "와글타운 | Waggle Town",
    description: "작은 네모콩 주민들이 지상 마을과 돌산에서 생활하고 싸우는 따뜻한 2D 사이드뷰 게임",
    images: [`${repositoryBasePath}/og.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#dbead8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

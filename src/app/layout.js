import { Noto_Sans_JP, Roboto } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import ThemeRegistry from "@/app/components/ThemeRegistry/ThemeRegistry";
// Noto Sans JP フォントを定義
const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700", "900"], // 必要なウェイトを指定
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp", // CSS変数名
});

// Roboto の設定
const roboto = Roboto({
  weight: ["300", "400", "500", "700"], // 必要なウェイトを指定
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto", // CSS変数名
});

export const metadata = {
  title: "楽天ミュージック 音楽ニュースサイト",
  description: "最新の音楽・エンタメの情報がここで見つかる！",
};

export default function RootLayout({ children }) {
  return (
    // `className`でフォントを適用するか、`style`でCSS変数を定義する
    // ここではHTML要素全体に適用するために `className` に変数を渡します。
    <html lang="ja" className={`${notoSansJP.variable} ${roboto.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

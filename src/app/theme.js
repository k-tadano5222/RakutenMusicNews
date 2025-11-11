// src/theme.js
// クライアントコンポーネントとしてマークします
"use client";

import { createTheme } from "@mui/material/styles";
// next/font から読み込んだフォントをインポート
import { Noto_Sans_JP, Roboto } from "next/font/google";

// next/font で定義したフォントを再度インポートして、
// その `style.fontFamily` プロパティをテーマに適用します。
const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// テーマオブジェクトを作成
const theme = createTheme({
  typography: {
    // `next/font` の `style.fontFamily` プロパティを使用し、
    // Fallback フォントも指定します。
    fontFamily: `${notoSansJP.style.fontFamily}, ${roboto.style.fontFamily}, "Helvetica Neue", Arial, sans-serif`,
    // 必要に応じて、他のタイポグラフィ設定（h1, body1 などの fontSize, fontWeight）もここに追加できます
    // h1: {
    //   fontSize: '3rem',
    //   fontWeight: 700,
    // },
    // body1: {
    //   fontSize: '1rem',
    // },
  },
  // カラーパレットやコンポーネントのデフォルトスタイルなど、
  // 他のテーマ設定もここに追加できます。
  // palette: {
  //   primary: {
  //     main: '#1976d2',
  //   },
  // },
});

export default theme;
